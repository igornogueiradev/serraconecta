import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Phone, CalendarDays, ChevronDown, CheckCircle2, Clock, Star } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import type { Lead, LeadStatus } from '@/integrations/firebase/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LABEL_STATUS: Record<LeadStatus, string> = {
  novo: 'Novo',
  respondido: 'Respondido',
  agendado: 'Agendado',
};

const COR_STATUS: Record<LeadStatus, string> = {
  novo: 'bg-amber-100 text-amber-700',
  respondido: 'bg-blue-100 text-blue-700',
  agendado: 'bg-green-100 text-green-700',
};

const LABEL_SERVICO: Record<string, string> = {
  transfer_aeroporto: 'Transfer Aeroporto',
  city_tour: 'City Tour',
  vinicola: 'Vinícola',
  passeio: 'Passeio',
  outro: 'Outro',
};

function formatarDataCriacao(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default function LeadsPage() {
  const { leads, isLoading, atualizarStatus } = useLeads();
  const navigate = useNavigate();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<LeadStatus | 'todos'>('todos');

  const filtrados = filtro === 'todos' ? leads : leads.filter(l => l.status === filtro);

  function abrirWhatsApp(lead: Lead) {
    const tel = lead.telefone.replace(/\D/g, '');
    const dataStr = lead.data_desejada
      ? lead.data_desejada.split('-').reverse().join('/')
      : '';
    const dataTexto = dataStr ? ` para o dia ${dataStr}` : '';
    const servicoTexto = lead.servico ? ` (${LABEL_SERVICO[lead.servico] ?? lead.servico})` : '';
    const msg = `Olá, ${lead.nome}! 👋\n\nRecebi seu pedido de orçamento${servicoTexto}${dataTexto}. Vou te passar todos os detalhes!\n\nAtenciosamente,\nIgor — Meu Executivo Gramado 🚗`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function converterEmAgendamento(lead: Lead) {
    const state: Record<string, unknown> = {};
    if (lead.data_desejada) state.data = lead.data_desejada;
    if (lead.destino) state.destino = lead.destino;
    if (lead.nome) state.clienteNome = lead.nome;
    navigate('/financeiro/novo-agendamento', { state });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Users2 className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-slate-800">Leads</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'novo', 'respondido', 'agendado'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filtro === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}>
              {f === 'todos' ? 'Todos' : LABEL_STATUS[f]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-12 text-slate-400 text-sm">Carregando...</div>
        )}

        {!isLoading && filtrados.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <Users2 size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum lead encontrado</p>
            <p className="text-slate-400 text-sm mt-1">
              Os pedidos de orçamento do seu site aparecerão aqui.
            </p>
          </div>
        )}

        {filtrados.map(lead => (
          <CardLead
            key={lead.id}
            lead={lead}
            expandido={expandidoId === lead.id}
            onToggle={() => setExpandidoId(expandidoId === lead.id ? null : lead.id!)}
            onWhatsApp={() => abrirWhatsApp(lead)}
            onAgendar={() => converterEmAgendamento(lead)}
            onStatus={(s) => atualizarStatus(lead.id!, s)}
          />
        ))}
      </div>
    </div>
  );
}

interface CardLeadProps {
  lead: Lead;
  expandido: boolean;
  onToggle: () => void;
  onWhatsApp: () => void;
  onAgendar: () => void;
  onStatus: (s: LeadStatus) => void;
}

function CardLead({ lead, expandido, onToggle, onWhatsApp, onAgendar, onStatus }: CardLeadProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={onToggle}>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users2 size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{lead.nome}</p>
          <p className="text-xs text-slate-400 truncate">
            {lead.servico ? LABEL_SERVICO[lead.servico] : 'Serviço não informado'}
            {lead.data_desejada ? ` · ${lead.data_desejada.split('-').reverse().join('/')}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[lead.status]}`}>
            {LABEL_STATUS[lead.status]}
          </span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`} />
      </button>

      {expandido && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="py-3 flex flex-col gap-1.5 text-sm text-slate-600">
            <Row label="Telefone" value={lead.telefone} />
            {lead.email && <Row label="E-mail" value={lead.email} />}
            {lead.data_desejada && <Row label="Data desejada" value={lead.data_desejada.split('-').reverse().join('/')} />}
            {lead.destino && <Row label="Destino / Rota" value={lead.destino} />}
            {lead.servico && <Row label="Serviço" value={LABEL_SERVICO[lead.servico] ?? lead.servico} />}
            {lead.mensagem && (
              <div className="mt-1">
                <p className="text-xs text-slate-400 mb-0.5">Mensagem</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{lead.mensagem}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">{formatarDataCriacao(lead.created_at)}</p>
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            <button onClick={onWhatsApp}
              className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl font-medium transition-colors">
              <Phone size={13} /> WhatsApp
            </button>
            {lead.status !== 'agendado' && (
              <button onClick={onAgendar}
                className="flex items-center gap-1.5 text-xs bg-primary hover:opacity-90 text-white px-3 py-2 rounded-xl font-medium transition-opacity">
                <CalendarDays size={13} /> Converter em Agendamento
              </button>
            )}
            {lead.status === 'novo' && (
              <button onClick={() => onStatus('respondido')}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 py-2">
                <CheckCircle2 size={13} /> Marcar Respondido
              </button>
            )}
            {lead.status !== 'agendado' && (
              <button onClick={() => onStatus('agendado')}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 py-2">
                <Star size={13} /> Marcar Agendado
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
