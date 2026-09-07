import { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, documentId, orderBy,
} from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Driver, DriverInsert } from '@/integrations/firebase/types';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);

      const driversSnap = await getDocs(
        query(collection(db, 'drivers'), where('status', '==', 'active'))
      );
      const driversData = driversSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Omit<Driver, 'profiles'>[];

      const userIds = [...new Set(driversData.map(d => d.user_id))];
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        // Firestore 'in' suporta até 30 itens
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += 30) chunks.push(userIds.slice(i, i + 30));

        for (const chunk of chunks) {
          const profilesSnap = await getDocs(
            query(collection(db, 'users'), where(documentId(), 'in', chunk))
          );
          profilesSnap.docs.forEach(d => { profilesMap[d.id] = { user_id: d.id, ...d.data() }; });
        }
      }

      setDrivers(driversData.map(d => ({ ...d, profiles: profilesMap[d.user_id] || null })) as Driver[]);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Erro ao carregar motoristas');
      toast({ title: 'Erro', description: 'Não foi possível carregar os motoristas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const addDriver = async (driverData: DriverInsert) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
        return false;
      }

      await addDoc(collection(db, 'drivers'), {
        ...driverData,
        user_id: user.uid,
        created_at: new Date().toISOString(),
      });

      toast({ title: 'Sucesso!', description: 'Disponibilidade cadastrada com sucesso' });
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error adding driver:', err);
      toast({ title: 'Erro', description: 'Não foi possível cadastrar a disponibilidade', variant: 'destructive' });
      return false;
    }
  };

  const updateDriver = async (id: string, updates: Partial<Driver>) => {
    try {
      const { profiles: _, ...safeUpdates } = updates as any;
      await updateDoc(doc(db, 'drivers', id), safeUpdates);
      toast({ title: 'Sucesso!', description: 'Disponibilidade atualizada com sucesso' });
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error updating driver:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a disponibilidade', variant: 'destructive' });
      return false;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'drivers', id));
      toast({ title: 'Sucesso!', description: 'Disponibilidade removida com sucesso' });
      await fetchDrivers();
      return true;
    } catch (err) {
      console.error('Error deleting driver:', err);
      toast({ title: 'Erro', description: 'Não foi possível remover a disponibilidade', variant: 'destructive' });
      return false;
    }
  };

  const fetchMyDrivers = async () => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) { setError('Usuário não autenticado'); return []; }

      const driversSnap = await getDocs(
        query(collection(db, 'drivers'), where('user_id', '==', user.uid))
      );
      const driversData = driversSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Omit<Driver, 'profiles'>[];

      const profileSnap = await getDocs(
        query(collection(db, 'users'), where(documentId(), 'in', [user.uid]))
      );
      const profile = profileSnap.docs[0] ? { user_id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } : null;

      return driversData.map(d => ({ ...d, profiles: profile })) as Driver[];
    } catch (err) {
      console.error('Error fetching my drivers:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar suas disponibilidades', variant: 'destructive' });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  return { drivers, isLoading, error, addDriver, updateDriver, deleteDriver, refetch: fetchDrivers, fetchMyDrivers };
};
