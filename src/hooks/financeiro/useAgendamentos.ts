import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { buscarAgendamentoPorId } from '@/integrations/firebase/financeiro';
import type { Agendamento } from '@/integrations/firebase/types';
import { format } from 'date-fns';

export function useAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'agendamentos'),
        where('user_id', '==', user.uid),
        orderBy('data', 'asc')
      );
      const snap = await getDocs(q);
      setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Agendamento[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { agendamentos, isLoading, refetch: fetch };
}

export interface AgendamentoProximo extends Agendamento {
  quando: 'hoje' | 'amanha';
}

export function useAgendamentosProximos() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoProximo[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const hojeStr = format(new Date(), 'yyyy-MM-dd');
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = format(amanha, 'yyyy-MM-dd');

    const qHoje = query(
      collection(db, 'agendamentos'),
      where('user_id', '==', user.uid),
      where('data', '==', hojeStr),
      where('status', 'in', ['agendado', 'confirmado'])
    );
    const qAmanha = query(
      collection(db, 'agendamentos'),
      where('user_id', '==', user.uid),
      where('data', '==', amanhaStr),
      where('status', 'in', ['agendado', 'confirmado'])
    );

    Promise.all([getDocs(qHoje), getDocs(qAmanha)]).then(([snapHoje, snapAmanha]) => {
      const horaAtual = format(new Date(), 'HH:mm');

      const deHoje = snapHoje.docs
        .map(d => ({ id: d.id, ...d.data() } as Agendamento))
        .filter(a => a.hora >= horaAtual)
        .map(a => ({ ...a, quando: 'hoje' as const }));

      const deAmanha = snapAmanha.docs
        .map(d => ({ id: d.id, ...d.data() } as Agendamento))
        .map(a => ({ ...a, quando: 'amanha' as const }));

      setAgendamentos([...deHoje, ...deAmanha].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)));
    });
  }, []);

  return agendamentos;
}

export function useAgendamentoPorId(id: string | undefined) {
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    buscarAgendamentoPorId(id).then(a => { setAgendamento(a); setIsLoading(false); });
  }, [id]);

  return { agendamento, isLoading };
}
