import { useState } from 'react';
import {
  collection, addDoc, getDocs, query, where, writeBatch, doc, getDoc, increment,
  orderBy, limit, documentId,
} from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Rating } from '@/integrations/firebase/types';

export const useRatings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Verifica se o usuário atual já avaliou determinado request
  const hasRated = async (request_id: string): Promise<boolean> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return false;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'ratings'),
          where('request_id', '==', request_id),
          where('rater_id', '==', uid),
        )
      );
      return !snap.empty;
    } catch {
      return false;
    }
  };

  // Submete uma avaliação e atualiza a média do usuário avaliado atomicamente
  const submitRating = async (params: {
    request_id: string;
    rated_user_id: string;
    score: number;
    comment?: string;
  }): Promise<boolean> => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
      return false;
    }
    try {
      setIsLoading(true);
      const batch = writeBatch(db);

      // 1. Cria o documento de avaliação
      const profileSnap = await getDoc(doc(db, 'users', uid));
      const raterName = profileSnap.data()?.full_name ?? null;

      const ratingRef = doc(collection(db, 'ratings'));
      batch.set(ratingRef, {
        request_id: params.request_id,
        rater_id: uid,
        rater_name: raterName,
        rated_user_id: params.rated_user_id,
        score: params.score,
        comment: params.comment ?? null,
        created_at: new Date().toISOString(),
      });

      // 2. Recalcula a média: busca avaliações existentes para o usuário avaliado
      const existingSnap = await getDocs(
        query(collection(db, 'ratings'), where('rated_user_id', '==', params.rated_user_id))
      );
      const existingScores = existingSnap.docs.map(d => (d.data() as Rating).score);
      const newCount = existingScores.length + 1;
      const newAvg = (existingScores.reduce((a, b) => a + b, 0) + params.score) / newCount;

      // 3. Atualiza os campos desnormalizados em users/{uid}
      const userRef = doc(db, 'users', params.rated_user_id);
      batch.update(userRef, {
        rating_avg: Math.round(newAvg * 10) / 10,
        rating_count: newCount,
      });

      await batch.commit();
      toast({ title: 'Avaliação enviada!', description: 'Obrigado pelo seu feedback.' });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível enviar a avaliação.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewsForUser = async (userId: string): Promise<Rating[]> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'ratings'),
          where('rated_user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(10),
        )
      );
      const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Rating);

      // Para reviews sem rater_name (criadas antes do campo existir), busca o perfil pelo rater_id
      const missingIds = [...new Set(reviews.filter(r => !r.rater_name).map(r => r.rater_id))];
      if (missingIds.length > 0) {
        const namesMap: Record<string, string> = {};
        const chunks: string[][] = [];
        for (let i = 0; i < missingIds.length; i += 30) chunks.push(missingIds.slice(i, i + 30));
        for (const chunk of chunks) {
          const profilesSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
          profilesSnap.docs.forEach(d => { namesMap[d.id] = d.data().full_name ?? 'Motorista'; });
        }
        return reviews.map(r => r.rater_name ? r : { ...r, rater_name: namesMap[r.rater_id] ?? 'Motorista' });
      }

      return reviews;
    } catch {
      return [];
    }
  };

  return { isLoading, hasRated, submitRating, fetchReviewsForUser };
};
