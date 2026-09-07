import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { buscarGastoPorId } from '@/integrations/firebase/financeiro';
import type { Gasto, PeriodoFiltro } from '@/integrations/firebase/types';
import { format } from 'date-fns';
import { getRangePeriodo } from '@/utils/financeiro/formatters';

export function useGastos(periodo?: PeriodoFiltro) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      let q;
      if (!periodo || periodo === 'geral') {
        q = query(
          collection(db, 'gastos'),
          where('user_id', '==', user.uid),
          orderBy('data', 'desc')
        );
      } else {
        const { inicio, fim } = getRangePeriodo(periodo);
        const inicioStr = format(inicio, 'yyyy-MM-dd');
        const fimStr = format(fim, 'yyyy-MM-dd');
        q = query(
          collection(db, 'gastos'),
          where('user_id', '==', user.uid),
          where('data', '>=', inicioStr),
          where('data', '<=', fimStr),
          orderBy('data', 'desc')
        );
      }
      const snap = await getDocs(q);
      setGastos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Gasto[]);
    } finally {
      setIsLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { gastos, isLoading, refetch: fetch };
}

export function useGastoPorId(id: string | undefined) {
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    buscarGastoPorId(id).then(g => { setGasto(g); setIsLoading(false); });
  }, [id]);

  return { gasto, isLoading };
}

export function useTodosGastos() {
  return useGastos('geral');
}
