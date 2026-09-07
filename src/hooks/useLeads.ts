import { useEffect, useState } from 'react';
import { db } from '@/integrations/firebase/client';
import {
  collection, getDocs, doc, updateDoc, orderBy, query,
} from 'firebase/firestore';
import type { Lead, LeadStatus } from '@/integrations/firebase/types';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refetch() {
    setIsLoading(true);
    const q = query(collection(db, 'leads'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Lead));
    setIsLoading(false);
  }

  useEffect(() => { refetch(); }, []);

  async function atualizarStatus(id: string, status: LeadStatus) {
    await updateDoc(doc(db, 'leads', id), { status, updated_at: new Date().toISOString() });
    refetch();
  }

  return { leads, isLoading, refetch, atualizarStatus };
}
