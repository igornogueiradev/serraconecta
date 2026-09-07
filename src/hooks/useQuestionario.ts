import { useEffect, useState } from 'react';
import { getRespostaPorAgendamento } from '@/integrations/firebase/questionario';
import type { QuestionarioResposta } from '@/integrations/firebase/types';

export function useQuestionario(agendamentoId: string | undefined) {
  const [resposta, setResposta] = useState<QuestionarioResposta | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function refetch() {
    if (!agendamentoId) return;
    setIsLoading(true);
    const r = await getRespostaPorAgendamento(agendamentoId);
    setResposta(r);
    setIsLoading(false);
  }

  useEffect(() => {
    refetch();
  }, [agendamentoId]);

  return { resposta, isLoading, refetch };
}
