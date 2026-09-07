import { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, documentId, orderBy,
} from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Trip, TripInsert } from '@/integrations/firebase/types';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrips = async () => {
    try {
      setIsLoading(true);

      const tripsSnap = await getDocs(
        query(collection(db, 'trips'), where('status', '==', 'active'))
      );
      const tripsData = tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Omit<Trip, 'profiles'>[];

      const userIds = [...new Set(tripsData.map(t => t.user_id))];
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += 30) chunks.push(userIds.slice(i, i + 30));

        for (const chunk of chunks) {
          const profilesSnap = await getDocs(
            query(collection(db, 'users'), where(documentId(), 'in', chunk))
          );
          profilesSnap.docs.forEach(d => { profilesMap[d.id] = { user_id: d.id, ...d.data() }; });
        }
      }

      setTrips(tripsData.map(t => ({ ...t, profiles: profilesMap[t.user_id] || null })) as Trip[]);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError('Erro ao carregar viagens');
      toast({ title: 'Erro', description: 'Não foi possível carregar as viagens', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const addTrip = async (tripData: TripInsert) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
        return false;
      }

      await addDoc(collection(db, 'trips'), {
        ...tripData,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Sucesso!', description: 'Viagem ofertada com sucesso' });
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error adding trip:', err);
      toast({ title: 'Erro', description: 'Não foi possível ofertar a viagem', variant: 'destructive' });
      return false;
    }
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    try {
      const { profiles: _, ...safeUpdates } = updates as any;
      await updateDoc(doc(db, 'trips', id), safeUpdates);
      toast({ title: 'Sucesso!', description: 'Viagem atualizada com sucesso' });
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error updating trip:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a viagem', variant: 'destructive' });
      return false;
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trips', id));
      toast({ title: 'Sucesso!', description: 'Viagem removida com sucesso' });
      await fetchTrips();
      return true;
    } catch (err) {
      console.error('Error deleting trip:', err);
      toast({ title: 'Erro', description: 'Não foi possível remover a viagem', variant: 'destructive' });
      return false;
    }
  };

  const fetchMyTrips = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) { setError('Usuário não autenticado'); return []; }

      const tripsSnap = await getDocs(
        query(collection(db, 'trips'), where('user_id', '==', user.uid))
      );
      const tripsData = tripsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Omit<Trip, 'profiles'>[];

      const profileSnap = await getDocs(
        query(collection(db, 'users'), where(documentId(), 'in', [user.uid]))
      );
      const profile = profileSnap.docs[0] ? { user_id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } : null;

      return tripsData.map(t => ({ ...t, profiles: profile })) as Trip[];
    } catch (err) {
      console.error('Error fetching my trips:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar suas viagens', variant: 'destructive' });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  return { trips, isLoading, error, addTrip, updateTrip, deleteTrip, refetch: fetchTrips, fetchMyTrips };
};
