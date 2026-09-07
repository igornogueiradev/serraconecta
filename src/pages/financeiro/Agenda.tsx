import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, ChevronDown, CheckCircle2, XCircle, CalendarDays, FileDown, Send, ClipboardList, Unlock } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { useAgendamentos } from '@/hooks/financeiro/useAgendamentos';
import { useUserProfile } from '@/hooks/useUserProfile';
import { atualizarAgendamento, deletarAgendamento } from '@/integrations/firebase/financeiro';
import { getRespostaPorAgendamento } from '@/integrations/firebase/questionario';
import { formatarMoeda, formatarData, LABEL_TIPO_AGENDAMENTO, LABEL_STATUS, COR_STATUS } from '@/utils/financeiro/formatters';
import { generateVoucherPDF } from '@/utils/generateVoucherPDF';
import { generateQuestionarioWhatsApp } from '@/utils/whatsapp';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Agendamento, QuestionarioResposta, StatusAgendamento } from '@/integrations/firebase/types';

type Leg = 'ida' | 'volta' | undefined;

interface CardItem {
  agendamento: Agendamento;
  leg: Leg;
  cardKey: string;
  displayData: string;
  displayHora: string;
  displayDestino: string | undefined;
}

function labelData(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00');
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  return format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function buildItems(agendamentos: Agendamento[], hoje: Date, onlyFuture: boolean): CardItem[] {
  const items: CardItem[] = [];
  for (const a of agendamentos) {
    const dataIda = startOfDay(new Date(a.data + 'T12:00:00'));
    const isFutureIda = dataIda >= hoje;
    const statusAtivo = a.status !== 'cancelado' && a.status !== 'concluido';

    if (onlyFuture ? (isFutureIda && statusAtivo) : (!isFutureIda || !statusAtivo)) {
      items.push({
        agendamento: a,
        leg: a.ida_e_volta ? 'ida' : undefined,
        cardKey: a.ida_e_volta ? `${a.id}-ida` : a.id!,
        displayData: a.data,
        displayHora: a.hora,
        displayDestino: a.destino,
      });
    }

    if (a.ida_e_volta && a.data_volta && statusAtivo) {
      const dataVolta = startOfDay(new Date(a.data_volta + 'T12:00:00'));
      const isFutureVolta = dataVolta >= hoje;
      if (onlyFuture ? isFutureVolta : !isFutureVolta) {
        items.push({
          agendamento: a,
          leg: 'volta',
          cardKey: `${a.id}-volta`,
          displayData: a.data_volta,
          displayHora: a.hora_volta ?? '',
          displayDestino: a.destino_volta,
        });
      }
    }
  }
  return items;
}

export default function Agenda() {
  const navigate = useNavigate();
  const { agendamentos, refetch } = useAgendamentos();
  const { profile } = useUserProfile();
  const [expandidoKey, setExpandidoKey] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [mostrarPassados, setMostrarPassados] = useState(false);

  const hoje = startOfDay(new Date());

  const futurosItems = buildItems(agendamentos, hoje, true);
  const passadosItems = buildItems(agendamentos, hoje, false);

  const grupos: Record<string, CardItem[]> = {};
  for (const item of futurosItems) {
    if (!grupos[item.displayData]) grupos[item.displayData] = [];
    grupos[item.displayData].push(item);
  }

  async function marcarStatus(id: string, status: StatusAgendamento) {
    await atualizarAgendamento(id, { status });
    refetch();
    setExpandidoKey(null);
  }

  async function confirmarDelete(id: string) {
    await deletarAgendamento(id);
    refetch();
    setConfirmandoId(null);
    setExpandidoKey(null);
  }

  function handleConcluir(a: Agendamento) {
    marcarStatus(a.id!, 'concluido');
    const saldo = (a.valorCombinado ?? 0) - (a.adiantamentoPago ?? 0);
    navigate('/financeiro/nova-receita', {
      state: {
        data: a.data,
        valorParticular: saldo > 0 ? saldo : (a.valorCombinado ?? undefined),
      },
    });
  }

  async function handlePermitirEdicao(a: Agendamento) {
    await atualizarAgendamento(a.id!, { questionario_edicao_habilitada: true });
    refetch();
  }

  async function handleQuestionario(a: Agendamento) {
    if (!a.questionario_enviado) {
      await atualizarAgendamento(a.id!, { questionario_enviado: true });
      refetch();
    }
    const waLink = generateQuestionarioWhatsApp({
      id: a.id!, clienteNome: a.clienteNome, data: a.data, hora: a.hora,
      ida_e_volta: a.ida_e_volta, data_volta: a.data_volta, hora_volta: a.hora_volta,
    });
    window.open(waLink, '_blank');
  }

  function renderCard(item: CardItem) {
    const { agendamento: a, leg, cardKey, displayData, displayHora, displayDestino } = item;
    return (
      <CardAgendamento
        key={cardKey}
        agendamento={a}
        leg={leg}
        displayData={displayData}
        displayHora={displayHora}
        displayDestino={displayDestino}
        expandido={expandidoKey === cardKey}
        confirmando={confirmandoId === a.id && leg !== 'volta'}
        onToggle={() => setExpandidoKey(expandidoKey === cardKey ? null : cardKey)}
        onEditar={() => navigate(`/financeiro/editar-agendamento/${a.id}`)}
        onConcluir={() => handleConcluir(a)}
        onCancelar={() => marcarStatus(a.id!, 'cancelado')}
        onConfirmar={() => marcarStatus(a.id!, 'confirmado')}
        onExcluir={() => setConfirmandoId(a.id!)}
        onConfirmarDelete={() => confirmarDelete(a.id!)}
        onCancelarDelete={() => setConfirmandoId(null)}
        onVoucher={() => generateVoucherPDF(a, profile)}
        onQuestionario={() => handleQuestionario(a)}
        onPermitirEdicao={() => handlePermitirEdicao(a)}
      />
    );
  }

  return (
    <FinanceiroLayout titulo="Agenda" helpKey="financeiro-agenda">
      <div className="flex flex-col gap-4">

        <button onClick={() => navigate('/financeiro/novo-agendamento')}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors">
          <PlusCircle size={20} />
          Novo Compromisso
        </button>

        {Object.keys(grupos).length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <CalendarDays size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum compromisso agendado</p>
            <p className="text-slate-400 text-sm mt-1">Toque em "Novo Compromisso" para adicionar</p>
          </div>
        )}

        {Object.entries(grupos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, lista]) => (
            <div key={key}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1 capitalize">
                {labelData(key)}
              </p>
              <div className="flex flex-col gap-2">
                {lista
                  .sort((a, b) => a.displayHora.localeCompare(b.displayHora))
                  .map(item => renderCard(item))}
              </div>
            </div>
          ))}

        {passadosItems.length > 0 && (
          <div>
            <button onClick={() => setMostrarPassados(p => !p)}
              className="w-full flex items-center justify-between px-1 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <span>Histórico ({passadosItems.length})</span>
              <ChevronDown size={14} className={`transition-transform ${mostrarPassados ? 'rotate-180' : ''}`} />
            </button>
            {mostrarPassados && (
              <div className="flex flex-col gap-2 mt-1">
                {passadosItems
                  .sort((a, b) => b.displayData.localeCompare(a.displayData))
                  .map(item => renderCard(item))}
              </div>
            )}
          </div>
        )}

      </div>
    </FinanceiroLayout>
  );
}

interface CardProps {
  agendamento: Agendamento;
  leg: Leg;
  displayData: string;
  displayHora: string;
  displayDestino: string | undefined;
  expandido: boolean;
  confirmando: boolean;
  onToggle: () => void;
  onEditar: () => void;
  onConcluir: () => void;
  onCancelar: () => void;
  onConfirmar: () => void;
  onExcluir: () => void;
  onConfirmarDelete: () => void;
  onCancelarDelete: () => void;
  onVoucher: () => void;
  onQuestionario: () => void;
  onPermitirEdicao: () => void;
}

function CardAgendamento({
  agendamento: a, leg, displayData, displayHora, displayDestino,
  expandido, confirmando,
  onToggle, onEditar, onConcluir, onCancelar, onConfirmar,
  onExcluir, onConfirmarDelete, onCancelarDelete, onVoucher, onQuestionario, onPermitirEdicao,
}: CardProps) {
  const ativo = a.status === 'agendado' || a.status === 'confirmado';
  const [resposta, setResposta] = useState<QuestionarioResposta | null>(null);

  useEffect(() => {
    if (expandido && a.questionario_respondido && !resposta) {
      getRespostaPorAgendamento(a.id!).then(setResposta);
    }
  }, [expandido, a.questionario_respondido]);

  const direcaoEfetiva = leg === 'ida' ? 'in' : leg === 'volta' ? 'out' : a.direcao;

  const legBadge = direcaoEfetiva === 'in'
    ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">🛬 IN</span>
    : direcaoEfetiva === 'out'
    ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">🛫 OUT</span>
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={onToggle}>
        <div className="w-16 flex-shrink-0 text-center">
          <p className="text-sm font-bold text-blue-700">{displayHora}</p>
          <p className="text-xs text-slate-400">{formatarData(displayData)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {a.clienteNome ?? ''}
            {a.clienteNome && displayDestino ? ' · ' : ''}
            {displayDestino ?? ''}
            {!a.clienteNome && !displayDestino ? 'Sem detalhes' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {legBadge}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[a.status]}`}>
            {LABEL_STATUS[a.status]}
          </span>
          {a.questionario_respondido ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Respondido</span>
          ) : a.questionario_enviado ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Aguardando</span>
          ) : null}
          {a.valorCombinado && (
            <span className="text-xs font-semibold text-green-700">{formatarMoeda(a.valorCombinado)}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${expandido ? 'rotate-180' : ''}`} />
      </button>

      {expandido && (
        <div className="px-4 pb-3 border-t border-slate-100">
          <div className="py-2 flex flex-col gap-1 text-sm text-slate-600">

            {/* Ida e volta: mostrar ambos os trajetos */}
            {a.ida_e_volta ? (
              <>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">🛬 IN</span>
                  <span className="text-right">{a.hora} · {formatarData(a.data)}{a.destino ? ` · ${a.destino}` : ''}</span>
                </div>
                {a.data_volta && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">🛫 OUT</span>
                    <span className="text-right">{a.hora_volta} · {formatarData(a.data_volta)}{a.destino_volta ? ` · ${a.destino_volta}` : ''}</span>
                  </div>
                )}
              </>
            ) : (
              displayDestino && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Rota</span>
                  <span className="text-right">{displayDestino}</span>
                </div>
              )
            )}

            {a.valorCombinado && (
              <div className="flex justify-between">
                <span className="text-slate-400">Valor total</span>
                <span className="text-green-700 font-medium">{formatarMoeda(a.valorCombinado)}</span>
              </div>
            )}
            {(a.adiantamentoPago ?? 0) > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Adiantamento pago</span>
                  <span className="text-blue-600 font-medium">{formatarMoeda(a.adiantamentoPago!)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 mt-1">
                  <span className="text-slate-500 font-medium">Saldo a receber</span>
                  <span className="text-orange-600 font-semibold">
                    {formatarMoeda((a.valorCombinado ?? 0) - a.adiantamentoPago!)}
                  </span>
                </div>
              </>
            )}
            {a.observacao && <p className="text-xs text-slate-400 italic mt-1">{a.observacao}</p>}
          </div>

          {resposta && (
            <div className="mt-2 mb-3 bg-slate-50 rounded-xl p-3 flex flex-col gap-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                <ClipboardList size={13} /> Dados do Cliente
              </p>
              <Row label="Nome" value={resposta.nome} />
              <Row label="Telefone" value={resposta.telefone} />
              {a.ida_e_volta ? (
                <>
                  {resposta.hotel && <Row label="Hotel" value={resposta.hotel} />}
                  {resposta.num_voo_ida && <Row label="Voo (IN)" value={resposta.num_voo_ida} />}
                  {resposta.num_voo_volta && <Row label="Voo (OUT)" value={resposta.num_voo_volta} />}
                </>
              ) : (
                <>
                  {resposta.ponto_embarque && <Row label="Embarque" value={resposta.ponto_embarque} />}
                  {resposta.num_voo && <Row label="Voo" value={resposta.num_voo} />}
                </>
              )}
              <Row label="Adultos" value={String(resposta.adultos)} />
              {(resposta.criancas ?? 0) > 0 && (
                <>
                  <Row label="Crianças" value={String(resposta.criancas)} />
                  {(resposta.cadeirinha ?? 0) > 0 && <Row label="Cadeirinha" value={`${resposta.cadeirinha} (motorista fornece)`} />}
                  {(resposta.elevacao ?? 0) > 0 && <Row label="Elevação" value={`${resposta.elevacao} (motorista fornece)`} />}
                </>
              )}
              {((resposta.bagagens_23kg ?? 0) + (resposta.bagagens_10kg ?? 0) + (resposta.bolsas ?? 0)) > 0 && (
                <Row label="Bagagens" value={[
                  (resposta.bagagens_23kg ?? 0) > 0 ? `${resposta.bagagens_23kg}×23kg` : '',
                  (resposta.bagagens_10kg ?? 0) > 0 ? `${resposta.bagagens_10kg}×10kg` : '',
                  (resposta.bolsas ?? 0) > 0 ? `${resposta.bolsas} bolsa(s)` : '',
                ].filter(Boolean).join(' | ')} />
              )}
              {resposta.item_volumoso && <Row label="Item volumoso" value={resposta.item_volumoso_desc || 'Sim'} />}
              {resposta.roteiro && <Row label="Roteiro" value={resposta.roteiro} />}
              {resposta.mobilidade_reduzida && <Row label="Mobilidade" value={resposta.mobilidade_reduzida_desc || 'Necessita atenção'} />}
              {resposta.observacoes && <Row label="Obs." value={resposta.observacoes} />}
            </div>
          )}

          {!confirmando ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {ativo && leg !== 'volta' && (
                <>
                  {a.status === 'agendado' && (
                    <button onClick={onConfirmar}
                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 py-1">
                      <CheckCircle2 size={14} /> Confirmar
                    </button>
                  )}
                  <button onClick={onConcluir}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1">
                    <CheckCircle2 size={14} /> Concluir → Receita
                  </button>
                  <button onClick={onCancelar}
                    className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 py-1">
                    <XCircle size={14} /> Cancelar
                  </button>
                </>
              )}
              {ativo && leg !== 'volta' && (
                <button onClick={onQuestionario}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 py-1">
                  <Send size={14} /> Questionário
                </button>
              )}
              {a.questionario_respondido && !a.questionario_edicao_habilitada && leg !== 'volta' && (
                <button onClick={onPermitirEdicao}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 py-1">
                  <Unlock size={14} /> Permitir edição
                </button>
              )}
              {a.questionario_edicao_habilitada && leg !== 'volta' && (
                <span className="flex items-center gap-1 text-xs text-amber-500 py-1">
                  <Unlock size={14} /> Edição habilitada
                </span>
              )}
              <button onClick={onVoucher}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 py-1">
                <FileDown size={14} /> Gerar Voucher
              </button>
              {leg !== 'volta' && (
                <>
                  <button onClick={onEditar}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-1">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={onExcluir}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 py-1">
                    <Trash2 size={14} /> Excluir
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <button onClick={onConfirmarDelete}
                className="flex-1 bg-red-600 text-white text-xs py-2 rounded-xl font-medium">
                Confirmar exclusão
              </button>
              <button onClick={onCancelarDelete}
                className="flex-1 bg-slate-100 text-slate-700 text-xs py-2 rounded-xl font-medium">
                Cancelar
              </button>
            </div>
          )}
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
