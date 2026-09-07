import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { buscarReceitaPorId } from '@/integrations/firebase/financeiro';
import type { Receita } from '@/integrations/firebase/types';
import { format } from 'date-fns';
import { getRangePeriodo } from '@/utils/financeiro/formatters';
import type { PeriodoFiltro } from '@/integrations/firebase/types';

export function useReceitas(periodo?: PeriodoFiltro) {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      let q;
      if (!periodo || periodo === 'geral') {
        q = query(
          collection(db, 'receitas'),
          where('user_id', '==', user.uid),
          orderBy('data', 'desc')
        );
      } else {
        const { inicio, fim } = getRangePeriodo(periodo);
        const inicioStr = format(inicio, 'yyyy-MM-dd');
        const fimStr = format(fim, 'yyyy-MM-dd');
        q = query(
          collection(db, 'receitas'),
          where('user_id', '==', user.uid),
          where('data', '>=', inicioStr),
          where('data', '<=', fimStr),
          orderBy('data', 'desc')
        );
      }
      const snap = await getDocs(q);
      setReceitas(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Receita[]);
    } finally {
      setIsLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { receitas, isLoading, refetch: fetch };
}

export function useReceitaPorId(id: string | undefined) {
  const [receita, setReceita] = useState<Receita | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    buscarReceitaPorId(id).then(r => { setReceita(r); setIsLoading(false); });
  }, [id]);

  return { receita, isLoading };
}

export function useTodasReceitas() {
  return useReceitas('geral');
}
