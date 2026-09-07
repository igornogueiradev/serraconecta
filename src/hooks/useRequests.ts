import { useState } from 'react';
import {
  collection, addDoc, updateDoc, getDocs,
  doc, query, where, getDoc, documentId,
} from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Request, RequestStatus, RequestType } from '@/integrations/firebase/types';

export const useRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentUid = () => auth.currentUser?.uid ?? null;

  // Cria uma nova solicitação (pelo solicitante)
  const createRequest = async (params: {
    type: RequestType;
    reference_id: string;
    owner_id: string;
    owner_name?: string;
    origin?: string;
    destination?: string;
    departure_date?: string;
    departure_time?: string;
    message?: string;
  }): Promise<string | null> => {
    const uid = currentUid();
    if (!uid) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    try {
      setIsLoading(true);
      const user = auth.currentUser!;

      // Busca dados do perfil do solicitante para desnormalizar
      const profileSnap = await getDoc(doc(db, 'users', uid));
      const profile = profileSnap.data();

      const ref = await addDoc(collection(db, 'requests'), {
        type: params.type,
        reference_id: params.reference_id,
        owner_id: params.owner_id,
        owner_name: params.owner_name ?? null,
        origin: params.origin ?? null,
        destination: params.destination ?? null,
        departure_date: params.departure_date ?? null,
        departure_time: params.departure_time ?? null,
        requester_id: uid,
        requester_name: profile?.full_name ?? user.email ?? 'Motorista',
        requester_phone: profile?.phone ?? '',
        status: 'pending' as RequestStatus,
        message: params.message ?? null,
        created_at: new Date().toISOString(),
      });
      toast({ title: 'Solicitação enviada!', description: 'O motorista será notificado.' });
      return ref.id;
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível enviar a solicitação.', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Atualiza status de uma solicitação (owner aceita/rejeita/conclui; requester cancela)
  const updateRequestStatus = async (id: string, status: RequestStatus): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'requests', id), {
        status,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a solicitação.', variant: 'destructive' });
      return false;
    }
  };

  // Busca solicitações recebidas pelo owner (para MyDriversPage / MyTripsPage)
  const fetchRequestsForOwner = async (): Promise<Request[]> => {
    const uid = currentUid();
    if (!uid) return [];
    try {
      setIsLoading(true);
      const snap = await getDocs(
        query(
          collection(db, 'requests'),
          where('owner_id', '==', uid),
        )
      );
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as Request)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Busca solicitações feitas pelo próprio usuário (para MinhasSolicitacoes)
  const fetchMyRequests = async (): Promise<Request[]> => {
    const uid = currentUid();
    if (!uid) return [];
    try {
      setIsLoading(true);
      const snap = await getDocs(
        query(
          collection(db, 'requests'),
          where('requester_id', '==', uid),
        )
      );
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }) as Request)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Busca solicitações para um card específico (para saber se o usuário já solicitou)
  const fetchRequestsForReference = async (reference_id: string): Promise<Request[]> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'requests'),
          where('reference_id', '==', reference_id),
        )
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Request[];
    } catch {
      return [];
    }
  };

  // Busca perfis de usuários por IDs (para exibir ratings dos solicitantes)
  const fetchUsersByIds = async (ids: string[]): Promise<Record<string, { rating_avg?: number; rating_count?: number; full_name?: string }>> => {
    if (ids.length === 0) return {};
    try {
      const map: Record<string, any> = {};
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
      for (const chunk of chunks) {
        const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
        snap.docs.forEach(d => { map[d.id] = d.data(); });
      }
      return map;
    } catch {
      return {};
    }
  };

  return {
    isLoading,
    createRequest,
    updateRequestStatus,
    fetchRequestsForOwner,
    fetchMyRequests,
    fetchRequestsForReference,
    fetchUsersByIds,
  };
};
