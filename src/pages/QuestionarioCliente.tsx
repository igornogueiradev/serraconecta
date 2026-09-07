import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getAgendamentoParaQuestionario,
  getRespostaPorAgendamento,
  salvarResposta,
} from '@/integrations/firebase/questionario';
import { generateVoucherPDF } from '@/utils/generateVoucherPDF';
import { LABEL_TIPO_AGENDAMENTO } from '@/utils/financeiro/formatters';
import type { Agendamento, QuestionarioResposta } from '@/integrations/firebase/types';
import { FileDown, Lock, CheckCircle2 } from 'lucide-react';

function isTransfer(tipo: string) {
  return tipo === 'transfer' || tipo === 'transfer_poa' || tipo === 'transfer_caxias';
}

const VAZIO = {
  nome: '', telefone: '', ponto_embarque: '', num_voo: '',
  hotel: '', num_voo_ida: '', num_voo_volta: '',
  adultos: 1, criancas: 0, cadeirinha: 0, elevacao: 0,
  bagagens_23kg: 0, bagagens_10kg: 0, bolsas: 0,
  item_volumoso: false, item_volumoso_desc: '',
  roteiro: '', mobilidade_reduzida: false, mobilidade_reduzida_desc: '',
  observacoes: '',
};
type FormState = typeof VAZIO;

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function fmtMoeda(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function MiniVoucher({ agendamento }: { agendamento: Agendamento }) {
  return (
    <div style={{ background: '#13324a' }} className="rounded-2xl px-5 py-4 mb-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <img src="/LOGO.png" alt="logo" className="w-10 h-10 object-cover rounded-md" />
        <div>
          <p className="font-bold text-sm leading-tight">Meu Executivo Gramado</p>
          <p className="text-xs opacity-60">Transfer Executivo · Serra Gaúcha</p>
        </div>
      </div>
      <div className="border-t border-white/20 pt-3 flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <span className="opacity-60">Serviço</span>
          <span className="font-medium">{LABEL_TIPO_AGENDAMENTO[agendamento.tipo] ?? agendamento.tipo}</span>
        </div>

        {agendamento.ida_e_volta ? (
          <>
            <div className="flex justify-between items-center">
              <span className="opacity-60">🛬 IN</span>
              <span className="font-medium">{formatDate(agendamento.data)} às {agendamento.hora}</span>
            </div>
            {agendamento.destino && (
              <div className="flex justify-between gap-4 pl-4">
                <span className="opacity-40 shrink-0 text-xs">Rota</span>
                <span className="text-right text-xs opacity-80">{agendamento.destino}</span>
              </div>
            )}
            {agendamento.data_volta && (
              <div className="flex justify-between items-center">
                <span className="opacity-60">🛫 OUT</span>
                <span className="font-medium">{formatDate(agendamento.data_volta)} às {agendamento.hora_volta}</span>
              </div>
            )}
            {agendamento.destino_volta && (
              <div className="flex justify-between gap-4 pl-4">
                <span className="opacity-40 shrink-0 text-xs">Rota</span>
                <span className="text-right text-xs opacity-80">{agendamento.destino_volta}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="opacity-60">Data</span>
              <span className="font-medium">{formatDate(agendamento.data)} às {agendamento.hora}</span>
            </div>
            {agendamento.destino && (
              <div className="flex justify-between gap-4">
                <span className="opacity-60 shrink-0">Rota</span>
                <span className="font-medium text-right">{agendamento.destino}</span>
              </div>
            )}
          </>
        )}

        {agendamento.valorCombinado && (
          <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
            <span className="opacity-60">Valor</span>
            <span className="font-semibold" style={{ color: '#a8c496' }}>
              {fmtMoeda(agendamento.valorCombinado)}
              {(agendamento.adiantamentoPago ?? 0) > 0 && (
                <span className="font-normal opacity-70 text-xs ml-1">
                  (saldo: {fmtMoeda(agendamento.valorCombinado - agendamento.adiantamentoPago!)})
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function QuestionarioCliente() {
  const { id } = useParams<{ id: string }>();
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [resposta, setResposta] = useState<QuestionarioResposta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [expirado, setExpirado] = useState(false);
  const [form, setForm] = useState<FormState>(VAZIO);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const ag = await getAgendamentoParaQuestionario(id!);
      if (!ag) { setIsLoading(false); return; }

      const lastData = ag.ida_e_volta && ag.data_volta ? ag.data_volta : ag.data;
      const lastHora = ag.ida_e_volta && ag.hora_volta ? ag.hora_volta : ag.hora;
      const agendamentoDatetime = new Date(`${lastData}T${lastHora}:00`);
      if (agendamentoDatetime < new Date()) {
        setExpirado(true); setIsLoading(false); return;
      }

      setAgendamento(ag as Agendamento);
      const resp = await getRespostaPorAgendamento(id!);
      if (resp) {
        setResposta(resp);
        setForm({
          nome: resp.nome ?? '',
          telefone: resp.telefone ?? '',
          ponto_embarque: resp.ponto_embarque ?? '',
          num_voo: resp.num_voo ?? '',
          hotel: resp.hotel ?? '',
          num_voo_ida: resp.num_voo_ida ?? '',
          num_voo_volta: resp.num_voo_volta ?? '',
          adultos: resp.adultos ?? 1,
          criancas: resp.criancas ?? 0,
          cadeirinha: resp.cadeirinha ?? 0,
          elevacao: resp.elevacao ?? 0,
          bagagens_23kg: resp.bagagens_23kg ?? 0,
          bagagens_10kg: resp.bagagens_10kg ?? 0,
          bolsas: resp.bolsas ?? 0,
          item_volumoso: resp.item_volumoso ?? false,
          item_volumoso_desc: resp.item_volumoso_desc ?? '',
          roteiro: resp.roteiro ?? '',
          mobilidade_reduzida: resp.mobilidade_reduzida ?? false,
          mobilidade_reduzida_desc: resp.mobilidade_reduzida_desc ?? '',
          observacoes: resp.observacoes ?? '',
        });
      }
      setIsLoading(false);
    }
    load();
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !agendamento) return;
    setIsSaving(true);
    const dados = { agendamento_id: id, owner_id: agendamento.user_id, ...form };
    await salvarResposta(id, dados);
    setResposta({ ...dados });
    setIsSaving(false);
    setEnviado(true);
  }

  async function handleDownload(ag: Agendamento, resp: QuestionarioResposta | null) {
    setIsDownloading(true);
    try { await generateVoucherPDF(ag, null, resp); }
    finally { setIsDownloading(false); }
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const btnAzul = 'w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-2xl text-sm transition-colors disabled:opacity-60';

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  );

  if (expirado) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <p className="text-3xl mb-3">⏰</p>
        <h2 className="font-semibold text-slate-800 mb-2">Link expirado</h2>
        <p className="text-slate-500 text-sm">Este link não está mais disponível após a data do serviço.</p>
      </div>
    </div>
  );

  if (!agendamento) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
        <p className="text-3xl mb-3">🔍</p>
        <h2 className="font-semibold text-slate-800 mb-2">Reserva não encontrada</h2>
        <p className="text-slate-500 text-sm">O link pode estar inválido ou expirado.</p>
      </div>
    </div>
  );

  const bloqueado = !!agendamento.questionario_respondido && !agendamento.questionario_edicao_habilitada;
  const transfer = isTransfer(agendamento.tipo);

  // Tela bloqueada
  if (bloqueado && !enviado) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <MiniVoucher agendamento={agendamento} />
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-green-600" />
              <h2 className="font-semibold text-slate-700">Seus dados confirmados</h2>
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              {resposta?.nome && <Row label="Nome" value={resposta.nome} />}
              {resposta?.telefone && <Row label="Telefone" value={resposta.telefone} />}
              {agendamento.ida_e_volta ? (
                <>
                  {resposta?.hotel && <Row label="Hotel" value={resposta.hotel} />}
                  {resposta?.num_voo_ida && <Row label="Voo (IN)" value={resposta.num_voo_ida} />}
                  {resposta?.num_voo_volta && <Row label="Voo (OUT)" value={resposta.num_voo_volta} />}
                </>
              ) : (
                <>
                  {resposta?.num_voo && <Row label="Voo" value={resposta.num_voo} />}
                  {resposta?.ponto_embarque && <Row label="Embarque" value={resposta.ponto_embarque} />}
                </>
              )}
              <Row label="Adultos" value={String(resposta?.adultos ?? 1)} />
              {(resposta?.criancas ?? 0) > 0 && <Row label="Crianças" value={String(resposta?.criancas)} />}
              {(resposta?.cadeirinha ?? 0) > 0 && <Row label="Cadeirinha" value={String(resposta?.cadeirinha)} />}
              {(resposta?.elevacao ?? 0) > 0 && <Row label="Elevação" value={String(resposta?.elevacao)} />}
              {resposta?.roteiro && <Row label="Roteiro" value={resposta.roteiro} />}
              {resposta?.mobilidade_reduzida && <Row label="Mobilidade" value={resposta.mobilidade_reduzida_desc || 'Necessita atenção'} />}
              {resposta?.observacoes && <Row label="Obs." value={resposta.observacoes} />}
            </div>
          </div>
          <button onClick={() => handleDownload(agendamento, resposta)} disabled={isDownloading}
            style={{ background: '#13324a' }} className={`${btnAzul} mb-3`}>
            <FileDown size={18} />
            {isDownloading ? 'Gerando...' : 'Baixar meu Voucher'}
          </button>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <Lock size={14} className="shrink-0" />
            <p>Para corrigir alguma informação, entre em contato com a agência.</p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de confirmação pós-envio
  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <MiniVoucher agendamento={agendamento} />
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center mb-4">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
            <h2 className="font-semibold text-slate-800 mb-1">Dados confirmados!</h2>
            <p className="text-slate-500 text-sm">Seu motorista já recebeu suas informações. Até logo! 🙏</p>
          </div>
          <button onClick={() => handleDownload(agendamento, resposta)} disabled={isDownloading}
            style={{ background: '#13324a' }} className={btnAzul}>
            <FileDown size={18} />
            {isDownloading ? 'Gerando...' : 'Baixar meu Voucher'}
          </button>
        </div>
      </div>
    );
  }

  // Formulário
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <MiniVoucher agendamento={agendamento} />

        {resposta && agendamento.questionario_edicao_habilitada && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-700">
            Edição habilitada pela agência. Corrija os dados e confirme.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-slate-700">Seus dados</h2>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Nome completo *</label>
            <input required value={form.nome} onChange={e => set('nome', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Telefone / WhatsApp *</label>
            <input required type="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)}
              placeholder="(00) 00000-0000" className={inputCls} />
          </div>
          {transfer && agendamento.ida_e_volta ? (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hotel / local de hospedagem</label>
                <input value={form.hotel} onChange={e => set('hotel', e.target.value)}
                  placeholder="Nome do hotel ou endereço" className={inputCls} />
              </div>

              <div className="bg-blue-50 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-xs text-blue-700 font-medium">🛬 Dados da chegada (IN)</p>
                <input value={form.num_voo_ida} onChange={e => set('num_voo_ida', e.target.value)}
                  placeholder="Número do voo de chegada — Ex: G3 1234" className={inputCls} />
              </div>

              <div className="bg-teal-50 rounded-xl p-3 flex flex-col gap-2">
                <p className="text-xs text-teal-700 font-medium">🛫 Dados da saída (OUT)</p>
                <input value={form.num_voo_volta} onChange={e => set('num_voo_volta', e.target.value)}
                  placeholder="Número do voo de saída — Ex: G3 5678" className={inputCls} />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {transfer ? 'Ponto de embarque' : 'Hotel / local de encontro'}
              </label>
              <input value={form.ponto_embarque} onChange={e => set('ponto_embarque', e.target.value)}
                placeholder={transfer ? 'Endereço ou terminal' : 'Nome do hotel ou endereço'}
                className={inputCls} />
            </div>
          )}

          {transfer && !agendamento.ida_e_volta && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Número do voo</label>
              <input value={form.num_voo} onChange={e => set('num_voo', e.target.value)}
                placeholder="Ex: G3 1234" className={inputCls} />
            </div>
          )}

          {!transfer && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Roteiro / pontos de interesse</label>
              <textarea value={form.roteiro} rows={3} onChange={e => set('roteiro', e.target.value)}
                placeholder="Ex: Cascata do Caracol, Snowland, centro de Gramado..."
                className={`${inputCls} resize-none`} />
            </div>
          )}

          <hr className="border-slate-100" />
          <h2 className="font-semibold text-slate-700">Passageiros</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Adultos *</label>
              <input required type="number" min={1} value={form.adultos}
                onChange={e => set('adultos', +e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Crianças</label>
              <input type="number" min={0} value={form.criancas}
                onChange={e => set('criancas', +e.target.value)} className={inputCls} />
            </div>
          </div>

          {form.criancas > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 flex flex-col gap-3">
              <p className="text-xs text-blue-700 font-medium">Equipamentos fornecidos pelo motorista:</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cadeirinha bebê</label>
                  <input type="number" min={0} max={form.criancas} value={form.cadeirinha}
                    onChange={e => set('cadeirinha', +e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Assento de elevação</label>
                  <input type="number" min={0} max={form.criancas} value={form.elevacao}
                    onChange={e => set('elevacao', +e.target.value)} className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-blue-500">Preencha apenas se precisar que o motorista forneça.</p>
            </div>
          )}

          {transfer && (
            <>
              <hr className="border-slate-100" />
              <h2 className="font-semibold text-slate-700">Bagagens</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">23 kg</label>
                  <input type="number" min={0} value={form.bagagens_23kg}
                    onChange={e => set('bagagens_23kg', +e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">10 kg (mão)</label>
                  <input type="number" min={0} value={form.bagagens_10kg}
                    onChange={e => set('bagagens_10kg', +e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Bolsas</label>
                  <input type="number" min={0} value={form.bolsas}
                    onChange={e => set('bolsas', +e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.item_volumoso}
                    onChange={e => set('item_volumoso', e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-slate-700">Tenho item volumoso (cadeira de rodas, carrinho, etc.)</span>
                </label>
                {form.item_volumoso && (
                  <input value={form.item_volumoso_desc}
                    onChange={e => set('item_volumoso_desc', e.target.value)}
                    placeholder="Descreva o item"
                    className={`${inputCls} mt-2`} />
                )}
              </div>
            </>
          )}

          {!transfer && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.mobilidade_reduzida}
                  onChange={e => set('mobilidade_reduzida', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700">Algum passageiro tem mobilidade reduzida</span>
              </label>
              {form.mobilidade_reduzida && (
                <input value={form.mobilidade_reduzida_desc}
                  onChange={e => set('mobilidade_reduzida_desc', e.target.value)}
                  placeholder="Ex: cadeira de rodas, dificuldade de locomoção..."
                  className={`${inputCls} mt-2`} />
              )}
            </div>
          )}

          <hr className="border-slate-100" />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Observações</label>
            <textarea value={form.observacoes} rows={3}
              onChange={e => set('observacoes', e.target.value)}
              placeholder="Alguma observação especial?"
              className={`${inputCls} resize-none`} />
          </div>

          <button type="submit" disabled={isSaving}
            style={{ background: '#13324a' }} className={btnAzul}>
            {isSaving ? 'Enviando...' : resposta ? 'Atualizar dados' : 'Confirmar dados'}
          </button>
        </form>
      </div>
    </div>
  );
}
