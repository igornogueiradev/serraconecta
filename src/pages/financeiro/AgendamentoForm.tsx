import { useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { LABEL_TIPO_AGENDAMENTO, LABEL_STATUS } from '@/utils/financeiro/formatters';
import { TIPOS_AGENDAMENTO, ROTEIROS, layoutTipo, montarRota, separarRota } from '@/utils/financeiro/agendamento';
import type { Agendamento, LeadVoo, StatusAgendamento, TipoAgendamento } from '@/integrations/firebase/types';

export type DadosAgendamento = Omit<Agendamento,
  'id' | 'user_id' | 'created_at' | 'questionario_enviado' | 'questionario_respondido' | 'questionario_edicao_habilitada'>;

const STATUS_OPTIONS: StatusAgendamento[] = ['agendado', 'confirmado', 'concluido', 'cancelado'];
const VOO_VAZIO = { companhia: '', numero: '', horario: '' };

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'text-sm font-medium text-slate-600';
const cardCls = 'bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3';

interface Props {
  inicial?: Partial<Agendamento>;
  comStatus?: boolean;
  textoBotao: string;
  icone: ReactNode;
  onSalvar: (dados: DadosAgendamento) => Promise<void>;
}

function vooParaDados(voo: typeof VOO_VAZIO): LeadVoo | undefined {
  const dados = {
    companhia: voo.companhia.trim() || undefined,
    numero: voo.numero.trim().toUpperCase() || undefined,
    horario: voo.horario || undefined,
  };
  return dados.companhia || dados.numero || dados.horario ? dados : undefined;
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function AgendamentoForm({ inicial = {}, comStatus, textoBotao, icone, onSalvar }: Props) {
  const layoutInicial = layoutTipo(inicial.tipo ?? 'transfer');
  const tipoInicial = layoutInicial === 'transfer' ? 'transfer' : inicial.tipo!;
  const [origemInicial, destinoInicial] = layoutInicial === 'transfer'
    ? separarRota(inicial.destino, inicial.origem)
    : [inicial.origem ?? '', inicial.destino ?? ''];

  const [tipo, setTipo] = useState<TipoAgendamento>(tipoInicial);
  const [status, setStatus] = useState<StatusAgendamento>(inicial.status ?? 'agendado');
  const [clienteNome, setClienteNome] = useState(inicial.clienteNome ?? '');
  const [clienteTelefone, setClienteTelefone] = useState(inicial.clienteTelefone ?? '');
  const [adultos, setAdultos] = useState(inicial.adultos ? String(inicial.adultos) : '');
  const [criancas, setCriancas] = useState(inicial.criancas ? String(inicial.criancas) : '');
  const [data, setData] = useState(inicial.data ?? format(new Date(), 'yyyy-MM-dd'));
  const [hora, setHora] = useState(inicial.hora ?? '');
  const [horaFim, setHoraFim] = useState(inicial.hora_fim ?? '');
  const [origem, setOrigem] = useState(origemInicial);
  const [destino, setDestino] = useState(destinoInicial);
  const [roteiroLivre, setRoteiroLivre] = useState(
    layoutInicial === 'passeio' && !!destinoInicial && !ROTEIROS.includes(destinoInicial));
  const [direcao, setDirecao] = useState<'in' | 'out' | ''>(inicial.direcao ?? '');
  const [idaEVolta, setIdaEVolta] = useState(!!inicial.ida_e_volta);
  const [dataVolta, setDataVolta] = useState(inicial.data_volta ?? '');
  const [horaVolta, setHoraVolta] = useState(inicial.hora_volta ?? '');
  const [destinoVolta, setDestinoVolta] = useState(inicial.destino_volta ?? '');
  const [vooIda, setVooIda] = useState({ ...VOO_VAZIO, ...inicial.voo_ida });
  const [vooVolta, setVooVolta] = useState({ ...VOO_VAZIO, ...inicial.voo_volta });
  const [valorCombinado, setValorCombinado] = useState(inicial.valorCombinado ? String(inicial.valorCombinado) : '');
  const [adiantamentoPago, setAdiantamentoPago] = useState(inicial.adiantamentoPago ? String(inicial.adiantamentoPago) : '');
  const [observacao, setObservacao] = useState(inicial.observacao ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const layout = layoutTipo(tipo);
  const tipos = TIPOS_AGENDAMENTO.includes(tipoInicial) ? TIPOS_AGENDAMENTO : [...TIPOS_AGENDAMENTO, tipoInicial];
  const rotaVoltaPadrao = montarRota(destino, origem);

  function trocarTipo(novo: TipoAgendamento) {
    if (layoutTipo(novo) !== layout) {
      setDestino('');
      setRoteiroLivre(false);
    }
    setTipo(novo);
  }

  async function handleSalvar() {
    setErro('');
    const transfer = layout === 'transfer';
    const voltar = transfer && idaEVolta;
    if (!data) { setErro('Informe a data.'); return; }
    if (!hora) { setErro(transfer ? 'Informe o horário da ida.' : 'Informe o horário de início.'); return; }
    if (voltar && !dataVolta) { setErro('Informe a data da volta.'); return; }
    if (voltar && !horaVolta) { setErro('Informe o horário da volta.'); return; }

    const dados: DadosAgendamento = {
      tipo, status, data, hora,
      clienteNome: clienteNome.trim() || undefined,
      clienteTelefone: clienteTelefone.trim() || undefined,
      adultos: adultos ? parseInt(adultos, 10) : undefined,
      criancas: criancas ? parseInt(criancas, 10) || undefined : undefined,
      origem: origem.trim() || undefined,
      destino: (transfer ? montarRota(origem, destino) : destino.trim()) || undefined,
      hora_fim: !transfer && horaFim ? horaFim : undefined,
      direcao: transfer && !idaEVolta && direcao ? direcao : undefined,
      ida_e_volta: voltar || undefined,
      data_volta: voltar ? dataVolta : undefined,
      hora_volta: voltar ? horaVolta : undefined,
      destino_volta: voltar ? (destinoVolta.trim() || rotaVoltaPadrao || undefined) : undefined,
      voo_ida: transfer ? vooParaDados(vooIda) : undefined,
      voo_volta: voltar ? vooParaDados(vooVolta) : undefined,
      valorCombinado: valorCombinado ? parseFloat(valorCombinado) : undefined,
      adiantamentoPago: adiantamentoPago ? parseFloat(adiantamentoPago) : undefined,
      observacao: observacao.trim() || undefined,
    };

    try {
      setSalvando(true);
      await onSalvar(dados);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function camposVoo(voo: typeof VOO_VAZIO, setVoo: (v: typeof VOO_VAZIO) => void, titulo: string) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{titulo}</p>
        <div className="grid grid-cols-3 gap-2">
          <input type="text" placeholder="Companhia" value={voo.companhia}
            onChange={e => setVoo({ ...voo, companhia: e.target.value })} className={inputCls} />
          <input type="text" placeholder="Nº do voo" value={voo.numero}
            onChange={e => setVoo({ ...voo, numero: e.target.value })} className={inputCls} />
          <input type="time" value={voo.horario} aria-label="Horário do voo"
            onChange={e => setVoo({ ...voo, horario: e.target.value })} className={inputCls} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      <div className={cardCls}>
        <label className={labelCls}>Tipo de compromisso</label>
        <div className="flex gap-2">
          {tipos.map(t => (
            <button key={t} type="button" onClick={() => trocarTipo(t)}
              className={`flex-1 py-2.5 px-1 rounded-xl text-sm font-medium border transition-colors ${
                tipo === t ? 'bg-blue-700 border-blue-700 text-white' : 'border-slate-200 text-slate-600'
              }`}>
              {LABEL_TIPO_AGENDAMENTO[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      <div className={cardCls}>
        <Campo label="Nome do cliente (opcional)">
          <input type="text" placeholder="Ex: João Silva" value={clienteNome}
            onChange={e => setClienteNome(e.target.value)} className={inputCls} />
        </Campo>
        <Campo label="Telefone / WhatsApp (opcional)">
          <input type="tel" placeholder="(00) 00000-0000" value={clienteTelefone}
            onChange={e => setClienteTelefone(e.target.value)} className={inputCls} />
        </Campo>
        <div className="flex gap-3">
          <Campo label="Adultos">
            <input type="number" inputMode="numeric" min={1} placeholder="Ex: 2" value={adultos}
              onChange={e => setAdultos(e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Crianças">
            <input type="number" inputMode="numeric" min={0} placeholder="Ex: 0" value={criancas}
              onChange={e => setCriancas(e.target.value)} className={inputCls} />
          </Campo>
        </div>
      </div>

      {layout === 'transfer' && (
        <>
          <div className={cardCls}>
            {idaEVolta && <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">✈ Ida</p>}
            <Campo label="Origem">
              <input type="text" placeholder="Ex: Aeroporto POA ou hotel" value={origem}
                onChange={e => setOrigem(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Destino">
              <input type="text" placeholder="Ex: Gramado" value={destino}
                onChange={e => setDestino(e.target.value)} className={inputCls} />
            </Campo>
            <div className="flex gap-3">
              <Campo label="Data *">
                <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
              </Campo>
              <Campo label="Horário *">
                <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputCls} />
              </Campo>
            </div>
            {camposVoo(vooIda, setVooIda, idaEVolta ? 'Voo de ida (opcional)' : 'Voo (opcional)')}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={idaEVolta} onChange={e => setIdaEVolta(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-sm font-medium text-slate-700">Ida e volta</span>
            </label>
          </div>

          {idaEVolta ? (
            <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">🔄 Volta</p>
              <div className="flex gap-3">
                <Campo label="Data da volta *">
                  <input type="date" value={dataVolta} min={data}
                    onChange={e => setDataVolta(e.target.value)} className={inputCls} />
                </Campo>
                <Campo label="Horário da volta *">
                  <input type="time" value={horaVolta}
                    onChange={e => setHoraVolta(e.target.value)} className={inputCls} />
                </Campo>
              </div>
              <Campo label="Rota da volta (opcional)">
                <input type="text" placeholder={rotaVoltaPadrao || 'Ex: Gramado → Aeroporto POA'} value={destinoVolta}
                  onChange={e => setDestinoVolta(e.target.value)} className={inputCls} />
              </Campo>
              {camposVoo(vooVolta, setVooVolta, 'Voo de volta (opcional)')}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              <label className={labelCls}>Direção (opcional)</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDirecao(direcao === 'in' ? '' : 'in')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    direcao === 'in' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-500'
                  }`}>
                  🛬 IN
                </button>
                <button type="button" onClick={() => setDirecao(direcao === 'out' ? '' : 'out')}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    direcao === 'out' ? 'bg-teal-100 border-teal-300 text-teal-700' : 'border-slate-200 text-slate-500'
                  }`}>
                  🛫 OUT
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {layout === 'passeio' && (
        <div className={cardCls}>
          <Campo label="Roteiro">
            <select value={roteiroLivre ? 'personalizado' : destino}
              onChange={e => {
                const livre = e.target.value === 'personalizado';
                setRoteiroLivre(livre);
                setDestino(livre ? '' : e.target.value);
              }} className={inputCls}>
              <option value="">Selecione</option>
              {ROTEIROS.map(r => <option key={r} value={r}>{r}</option>)}
              <option value="personalizado">Personalizado</option>
            </select>
          </Campo>
          {roteiroLivre && (
            <Campo label="Descreva o roteiro">
              <input type="text" placeholder="Ex: Caracol, Snowland e centro de Gramado" value={destino}
                onChange={e => setDestino(e.target.value)} className={inputCls} />
            </Campo>
          )}
          <Campo label="Local de embarque">
            <input type="text" placeholder="Hotel ou endereço" value={origem}
              onChange={e => setOrigem(e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Data *">
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </Campo>
          <div className="flex gap-3">
            <Campo label="Início *">
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Término previsto">
              <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inputCls} />
            </Campo>
          </div>
        </div>
      )}

      {layout === 'outro' && (
        <div className={cardCls}>
          <Campo label="Descrição">
            <input type="text" placeholder="Ex: Levar documentos ao cartório" value={destino}
              onChange={e => setDestino(e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Local (opcional)">
            <input type="text" placeholder="Endereço ou ponto de encontro" value={origem}
              onChange={e => setOrigem(e.target.value)} className={inputCls} />
          </Campo>
          <Campo label="Data *">
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </Campo>
          <div className="flex gap-3">
            <Campo label="Início *">
              <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Término previsto">
              <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inputCls} />
            </Campo>
          </div>
        </div>
      )}

      <div className={cardCls}>
        <Campo label="Valor combinado (opcional)">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={valorCombinado}
              onChange={e => setValorCombinado(e.target.value)} className={inputCls} />
          </div>
        </Campo>
        <Campo label="Adiantamento pago (opcional)">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={adiantamentoPago}
              onChange={e => setAdiantamentoPago(e.target.value)} className={inputCls} />
          </div>
        </Campo>
      </div>

      {comStatus && (
        <div className={cardCls}>
          <Campo label="Status">
            <select value={status} onChange={e => setStatus(e.target.value as StatusAgendamento)} className={inputCls}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LABEL_STATUS[s]}</option>)}
            </select>
          </Campo>
        </div>
      )}

      <div className={cardCls}>
        <Campo label="Observação (opcional)">
          <textarea rows={2} placeholder="Ex: Cadeirinha, bagagem extra, ponto de referência..." value={observacao}
            onChange={e => setObservacao(e.target.value)} className={`${inputCls} resize-none`} />
        </Campo>
      </div>

      {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

      <button onClick={handleSalvar} disabled={salvando}
        className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
        {icone}
        {salvando ? 'Salvando...' : textoBotao}
      </button>

    </div>
  );
}
