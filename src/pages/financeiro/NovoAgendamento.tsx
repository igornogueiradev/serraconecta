import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle, CalendarDays } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { AgendamentoForm, type DadosAgendamento } from './AgendamentoForm';
import { salvarAgendamento } from '@/integrations/firebase/financeiro';
import { LABEL_TIPO_AGENDAMENTO } from '@/utils/financeiro/formatters';
import type { Agendamento } from '@/integrations/firebase/types';

interface EstadoNavegacao {
  inicial?: Partial<Agendamento>;
  proximo?: Partial<Agendamento>;
}

export default function NovoAgendamento() {
  const location = useLocation();
  return <NovoAgendamentoTela key={location.key} estado={(location.state ?? {}) as EstadoNavegacao} />;
}

function NovoAgendamentoTela({ estado }: { estado: EstadoNavegacao }) {
  const navigate = useNavigate();
  const [sucesso, setSucesso] = useState(false);
  const { inicial, proximo } = estado;

  async function handleSalvar(dados: DadosAgendamento) {
    await salvarAgendamento(dados);
    setSucesso(true);
    if (!proximo) setTimeout(() => navigate('/financeiro/agenda'), 1200);
  }

  if (sucesso) {
    return (
      <FinanceiroLayout titulo="Novo Compromisso">
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <CheckCircle size={56} className="text-green-600" />
          <p className="text-lg font-semibold text-green-700">Compromisso agendado!</p>
          {proximo && (
            <div className="w-full flex flex-col gap-2 mt-4">
              <p className="text-sm text-slate-500 text-center">
                Este pedido também inclui {LABEL_TIPO_AGENDAMENTO[proximo.tipo ?? 'passeio']}.
              </p>
              <button onClick={() => navigate('/financeiro/novo-agendamento', { state: { inicial: proximo }, replace: true })}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <PlusCircle size={18} /> Agendar também o {LABEL_TIPO_AGENDAMENTO[proximo.tipo ?? 'passeio']}
              </button>
              <button onClick={() => navigate('/financeiro/agenda')}
                className="w-full bg-white border border-slate-200 text-slate-600 font-medium py-3 rounded-2xl flex items-center justify-center gap-2">
                <CalendarDays size={18} /> Ir para a Agenda
              </button>
            </div>
          )}
        </div>
      </FinanceiroLayout>
    );
  }

  return (
    <FinanceiroLayout titulo="Novo Compromisso" voltar>
      <AgendamentoForm
        inicial={inicial}
        textoBotao="Salvar Compromisso"
        icone={<PlusCircle size={20} />}
        onSalvar={handleSalvar}
      />
    </FinanceiroLayout>
  );
}
