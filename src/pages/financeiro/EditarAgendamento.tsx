import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { AgendamentoForm, type DadosAgendamento } from './AgendamentoForm';
import { buscarAgendamentoPorId, salvarEdicaoAgendamento } from '@/integrations/firebase/financeiro';
import type { Agendamento } from '@/integrations/firebase/types';

export default function EditarAgendamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!id) return;
    buscarAgendamentoPorId(id).then((a: Agendamento | null) => {
      if (!a) { navigate('/financeiro/agenda'); return; }
      setAgendamento(a);
    });
  }, [id, navigate]);

  async function handleSalvar(dados: DadosAgendamento) {
    await salvarEdicaoAgendamento(id!, dados);
    setSucesso(true);
    setTimeout(() => navigate('/financeiro/agenda'), 1200);
  }

  if (!agendamento) return (
    <FinanceiroLayout titulo="Editar Compromisso">
      <div className="text-center py-20 text-slate-400">Carregando...</div>
    </FinanceiroLayout>
  );

  if (sucesso) return (
    <FinanceiroLayout titulo="Editar Compromisso">
      <div className="flex flex-col items-center justify-center gap-4 mt-20">
        <CheckCircle size={56} className="text-green-600" />
        <p className="text-lg font-semibold text-green-700">Compromisso atualizado!</p>
      </div>
    </FinanceiroLayout>
  );

  return (
    <FinanceiroLayout titulo="Editar Compromisso" voltar>
      <AgendamentoForm
        inicial={agendamento}
        comStatus
        textoBotao="Salvar Alterações"
        icone={<Save size={20} />}
        onSalvar={handleSalvar}
      />
    </FinanceiroLayout>
  );
}
