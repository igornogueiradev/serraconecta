import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { buscarAgendamentoPorId, atualizarAgendamento } from '@/integrations/firebase/financeiro';
import { LABEL_TIPO_AGENDAMENTO, LABEL_STATUS } from '@/utils/financeiro/formatters';
import type { TipoAgendamento, StatusAgendamento, Agendamento } from '@/integrations/firebase/types';

const TIPOS: TipoAgendamento[] = ['transfer', 'passeio', 'fretamento', 'outro'];
const STATUS_OPTIONS: StatusAgendamento[] = ['agendado', 'confirmado', 'concluido', 'cancelado'];
const inputCls = 'border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function EditarAgendamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState<TipoAgendamento>('transfer');
  const [clienteNome, setClienteNome] = useState('');
  const [destino, setDestino] = useState('');
  const [valorCombinado, setValorCombinado] = useState('');
  const [adiantamentoPago, setAdiantamentoPago] = useState('');
  const [status, setStatus] = useState<StatusAgendamento>('agendado');
  const [observacao, setObservacao] = useState('');
  const [idaEVolta, setIdaEVolta] = useState(false);
  const [dataVolta, setDataVolta] = useState('');
  const [horaVolta, setHoraVolta] = useState('');
  const [destinoVolta, setDestinoVolta] = useState('');
  const [direcao, setDirecao] = useState<'in' | 'out' | ''>('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id) return;
    buscarAgendamentoPorId(id).then((a: Agendamento | null) => {
      if (!a) { navigate('/financeiro/agenda'); return; }
      setData(a.data);
      setHora(a.hora);
      setTipo(a.tipo);
      setClienteNome(a.clienteNome ?? '');
      setDestino(a.destino ?? '');
      setValorCombinado(a.valorCombinado ? String(a.valorCombinado) : '');
      setAdiantamentoPago(a.adiantamentoPago ? String(a.adiantamentoPago) : '');
      setStatus(a.status);
      setObservacao(a.observacao ?? '');
      setIdaEVolta(!!a.ida_e_volta);
      setDataVolta(a.data_volta ?? '');
      setHoraVolta(a.hora_volta ?? '');
      setDestinoVolta(a.destino_volta ?? '');
      setDirecao(a.direcao ?? '');
      setCarregando(false);
    });
  }, [id, navigate]);

  async function handleSalvar() {
    setErro('');
    if (!hora) { setErro('Informe o horário da ida.'); return; }
    if (idaEVolta && !dataVolta) { setErro('Informe a data da volta.'); return; }
    if (idaEVolta && !horaVolta) { setErro('Informe o horário da volta.'); return; }

    try {
      setSalvando(true);
      await atualizarAgendamento(id!, {
        data, hora, tipo,
        clienteNome: clienteNome || undefined,
        destino: destino || undefined,
        valorCombinado: valorCombinado ? parseFloat(valorCombinado) : undefined,
        adiantamentoPago: adiantamentoPago ? parseFloat(adiantamentoPago) : undefined,
        status,
        observacao: observacao || undefined,
        ida_e_volta: idaEVolta || undefined,
        data_volta: idaEVolta ? dataVolta : undefined,
        hora_volta: idaEVolta ? horaVolta : undefined,
        destino_volta: idaEVolta && destinoVolta ? destinoVolta : undefined,
        direcao: !idaEVolta && direcao ? direcao : undefined,
      });
      setSucesso(true);
      setTimeout(() => navigate('/financeiro/agenda'), 1200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return (
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
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          {idaEVolta && <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">✈ Ida</p>}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Horário</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={idaEVolta} onChange={e => setIdaEVolta(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm font-medium text-slate-700">Ida e volta</span>
          </label>
        </div>

        {idaEVolta && (
          <div className="bg-blue-50 rounded-2xl p-4 flex flex-col gap-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">🔄 Volta</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Data da volta *</label>
              <input type="date" value={dataVolta} onChange={e => setDataVolta(e.target.value)}
                min={data} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Horário da volta *</label>
              <input type="time" value={horaVolta} onChange={e => setHoraVolta(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Rota da volta (opcional)</label>
              <input type="text" placeholder="Ex: Gramado → Aeroporto POA" value={destinoVolta}
                onChange={e => setDestinoVolta(e.target.value)} className={`${inputCls} text-sm`} />
            </div>
          </div>
        )}

        {!idaEVolta && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Direção (opcional)</label>
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

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600">Tipo de compromisso</label>
          <div className="flex flex-col gap-2">
            {TIPOS.map(t => (
              <label key={t} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="tipo" value={t} checked={tipo === t}
                  onChange={() => setTipo(t)} className="accent-blue-600 w-4 h-4" />
                <span className="text-sm text-slate-700">{LABEL_TIPO_AGENDAMENTO[t]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Nome do cliente (opcional)</label>
            <input type="text" placeholder="Ex: João Silva" value={clienteNome}
              onChange={e => setClienteNome(e.target.value)} className={`${inputCls} text-sm`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">
              {idaEVolta ? 'Rota da ida (opcional)' : 'Destino / Rota (opcional)'}
            </label>
            <input type="text" placeholder="Ex: Aeroporto POA → Gramado" value={destino}
              onChange={e => setDestino(e.target.value)} className={`${inputCls} text-sm`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Valor combinado (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={valorCombinado}
                onChange={e => setValorCombinado(e.target.value)} className={`flex-1 ${inputCls}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Adiantamento pago (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={adiantamentoPago}
                onChange={e => setAdiantamentoPago(e.target.value)} className={`flex-1 ${inputCls}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-600">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as StatusAgendamento)}
            className={inputCls}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{LABEL_STATUS[s]}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Observação (opcional)</label>
          <textarea rows={2} placeholder="Ex: Buscar às 4h, voo às 7h..." value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className={`mt-1 w-full ${inputCls} text-sm resize-none`} />
        </div>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

        <button onClick={handleSalvar} disabled={salvando}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
          <Save size={20} />
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>

      </div>
    </FinanceiroLayout>
  );
}
