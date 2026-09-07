import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { format } from 'date-fns';
import type { Receita, Gasto, DashboardKpis, PeriodoFiltro } from '@/integrations/firebase/types';
import { calcularKpis, agruparPorDia } from '@/utils/financeiro/calculos';
import { getRangePeriodo } from '@/utils/financeiro/formatters';

export function useDashboard(periodo: PeriodoFiltro = 'mes') {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [grafico, setGrafico] = useState<{ dia: string; receita: number; gasto: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);

    try {
      let qReceitas, qGastos;

      if (periodo === 'geral') {
        qReceitas = query(collection(db, 'receitas'), where('user_id', '==', user.uid), orderBy('data', 'desc'));
        qGastos = query(collection(db, 'gastos'), where('user_id', '==', user.uid), orderBy('data', 'desc'));
      } else {
        const { inicio, fim } = getRangePeriodo(periodo);
        const inicioStr = format(inicio, 'yyyy-MM-dd');
        const fimStr = format(fim, 'yyyy-MM-dd');
        qReceitas = query(
          collection(db, 'receitas'),
          where('user_id', '==', user.uid),
          where('data', '>=', inicioStr),
          where('data', '<=', fimStr),
          orderBy('data', 'desc')
        );
        qGastos = query(
          collection(db, 'gastos'),
          where('user_id', '==', user.uid),
          where('data', '>=', inicioStr),
          where('data', '<=', fimStr),
          orderBy('data', 'desc')
        );
      }

      const [snapR, snapG] = await Promise.all([getDocs(qReceitas), getDocs(qGastos)]);
      const r = snapR.docs.map(d => ({ id: d.id, ...d.data() })) as Receita[];
      const g = snapG.docs.map(d => ({ id: d.id, ...d.data() })) as Gasto[];

      setReceitas(r);
      setGastos(g);
      setKpis(calcularKpis(r, g));
      setGrafico(agruparPorDia(r, g, 7));
    } finally {
      setIsLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { receitas, gastos, kpis, grafico, isLoading, refetch: fetch };
}
