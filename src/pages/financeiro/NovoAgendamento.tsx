import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { salvarAgendamento } from '@/integrations/firebase/financeiro';
import { LABEL_TIPO_AGENDAMENTO } from '@/utils/financeiro/formatters';
import { format } from 'date-fns';
import type { TipoAgendamento } from '@/integrations/firebase/types';

const TIPOS: TipoAgendamento[] = ['transfer', 'passeio', 'fretamento', 'outro'];

const inputCls = 'border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [data, setData] = useState(hoje);
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState<TipoAgendamento>('transfer');
  const [clienteNome, setClienteNome] = useState('');
  const [destino, setDestino] = useState('');
  const [valorCombinado, setValorCombinado] = useState('');
  const [adiantamentoPago, setAdiantamentoPago] = useState('');
  const [observacao, setObservacao] = useState('');
  const [idaEVolta, setIdaEVolta] = useState(false);
  const [dataVolta, setDataVolta] = useState('');
  const [horaVolta, setHoraVolta] = useState('');
  const [destinoVolta, setDestinoVolta] = useState('');
  const [direcao, setDirecao] = useState<'in' | 'out' | ''>('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSalvar() {
    setErro('');
    if (!hora) { setErro('Informe o horário da ida.'); return; }
    if (idaEVolta && !dataVolta) { setErro('Informe a data da volta.'); return; }
    if (idaEVolta && !horaVolta) { setErro('Informe o horário da volta.'); return; }

    try {
      setSalvando(true);
      await salvarAgendamento({
        data,
        hora,
        tipo,
        clienteNome: clienteNome || undefined,
        destino: destino || undefined,
        valorCombinado: valorCombinado ? parseFloat(valorCombinado) : undefined,
        adiantamentoPago: adiantamentoPago ? parseFloat(adiantamentoPago) : undefined,
        ida_e_volta: idaEVolta || undefined,
        data_volta: idaEVolta ? dataVolta : undefined,
        hora_volta: idaEVolta ? horaVolta : undefined,
        destino_volta: idaEVolta && destinoVolta ? destinoVolta : undefined,
        direcao: !idaEVolta && direcao ? direcao : undefined,
        status: 'agendado',
        observacao: observacao || undefined,
      });
      setSucesso(true);
      setTimeout(() => navigate('/financeiro/agenda'), 1200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (sucesso) {
    return (
      <FinanceiroLayout titulo="Novo Compromisso">
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <CheckCircle size={56} className="text-green-600" />
          <p className="text-lg font-semibold text-green-700">Compromisso agendado!</p>
        </div>
      </FinanceiroLayout>
    );
  }

  return (
    <FinanceiroLayout titulo="Novo Compromisso" voltar>
      <div className="flex flex-col gap-4">

        {/* Ida */}
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

        {/* Toggle ida e volta */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={idaEVolta} onChange={e => setIdaEVolta(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm font-medium text-slate-700">Ida e volta</span>
          </label>
        </div>

        {/* Volta */}
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

        {/* Direção (apenas trecho único) */}
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

        {/* Tipo */}
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

        {/* Detalhes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Nome do cliente (opcional)</label>
            <input type="text" placeholder="Ex: João Silva" value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
              className={`${inputCls} text-sm`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">
              {idaEVolta ? 'Rota da ida (opcional)' : 'Destino / Rota (opcional)'}
            </label>
            <input type="text" placeholder="Ex: Aeroporto POA → Gramado" value={destino}
              onChange={e => setDestino(e.target.value)}
              className={`${inputCls} text-sm`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Valor combinado (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={valorCombinado}
                onChange={e => setValorCombinado(e.target.value)}
                className={`flex-1 ${inputCls}`} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Adiantamento pago (opcional)</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={adiantamentoPago}
                onChange={e => setAdiantamentoPago(e.target.value)}
                className={`flex-1 ${inputCls}`} />
            </div>
          </div>
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
          <PlusCircle size={20} />
          {salvando ? 'Salvando...' : 'Salvar Compromisso'}
        </button>

      </div>
    </FinanceiroLayout>
  );
}
