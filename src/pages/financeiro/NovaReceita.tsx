import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Trash2, CheckCircle, Hash } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { salvarReceita } from '@/integrations/firebase/financeiro';
import type { AppNome, GanhoPorApp, TipoParticular } from '@/integrations/firebase/types';
import { LABEL_TIPO_PARTICULAR } from '@/utils/financeiro/formatters';
import { format } from 'date-fns';

const TIPOS_PARTICULAR: TipoParticular[] = ['particular', 'transfer', 'citytour', 'passeios', 'outro'];

const APPS_PADRAO: { id: AppNome; label: string; cor: string }[] = [
  { id: 'uber', label: 'Uber', cor: 'bg-black text-white' },
  { id: '99', label: '99', cor: 'bg-orange-500 text-white' },
  { id: 'blablacar', label: 'BlaBlaCar', cor: 'bg-blue-700 text-white' },
  { id: 'outro', label: '+ Outro', cor: 'bg-slate-200 text-slate-700' },
];

interface LinhaApp {
  app: AppNome;
  appNome: string;
  valor: string;
  qtdCorridas: string;
}

export default function NovaReceita() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as { data?: string; valorParticular?: number } | null;
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [data, setData] = useState(prefill?.data ?? hoje);
  const [kmTotal, setKmTotal] = useState('');
  const [linhasApp, setLinhasApp] = useState<LinhaApp[]>([]);
  const [valorParticular, setValorParticular] = useState(
    prefill?.valorParticular ? String(prefill.valorParticular) : ''
  );
  const [tipoParticular, setTipoParticular] = useState<TipoParticular>('particular');
  const [destinoParticular, setDestinoParticular] = useState('');
  const [qtdCorridasParticular, setQtdCorridasParticular] = useState('');
  const [temPedagio, setTemPedagio] = useState(false);
  const [pedagioParticular, setPedagioParticular] = useState('');
  const [gorjeta, setGorjeta] = useState('');
  const [comissao, setComissao] = useState('');
  const [comissaoDescricao, setComissaoDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  function adicionarApp(app: AppNome) {
    if (app !== 'outro' && linhasApp.some(l => l.app === app)) return;
    setLinhasApp(prev => [...prev, { app, appNome: '', valor: '', qtdCorridas: '' }]);
  }

  function atualizarLinha(idx: number, campo: keyof LinhaApp, val: string) {
    setLinhasApp(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: val } : l));
  }

  function removerLinha(idx: number) {
    setLinhasApp(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSalvar() {
    setErro('');
    const ganhosPorApp: GanhoPorApp[] = linhasApp
      .filter(l => l.valor && parseFloat(l.valor) > 0)
      .map(l => ({
        app: l.app,
        appNome: l.app === 'outro' ? l.appNome : undefined,
        valor: parseFloat(l.valor),
        qtdCorridas: l.qtdCorridas ? parseInt(l.qtdCorridas) : undefined,
      }));

    const vParticular = valorParticular ? parseFloat(valorParticular) : undefined;
    const temReceita = ganhosPorApp.length > 0 || (vParticular && vParticular > 0);

    if (!temReceita) { setErro('Informe pelo menos um valor de receita.'); return; }
    if (!kmTotal || parseFloat(kmTotal) < 0) { setErro('Informe o km total rodado.'); return; }

    try {
      setSalvando(true);
      await salvarReceita({
        data,
        kmTotal: parseFloat(kmTotal),
        ganhosPorApp,
        valorParticular: vParticular,
        pedagioParticular: temPedagio && pedagioParticular ? parseFloat(pedagioParticular) : undefined,
        tipoParticular: vParticular && vParticular > 0 ? tipoParticular : undefined,
        destinoParticular: destinoParticular || undefined,
        qtdCorridas: qtdCorridasParticular ? parseInt(qtdCorridasParticular) : undefined,
        gorjeta: gorjeta ? parseFloat(gorjeta) : undefined,
        comissao: comissao ? parseFloat(comissao) : undefined,
        comissaoDescricao: comissaoDescricao || undefined,
        observacao: observacao || undefined,
      });
      setSucesso(true);
      setTimeout(() => navigate('/financeiro/dashboard'), 1200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (sucesso) {
    return (
      <FinanceiroLayout titulo="Nova Receita">
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <CheckCircle size={56} className="text-green-600" />
          <p className="text-lg font-semibold text-green-700">Receita salva!</p>
        </div>
      </FinanceiroLayout>
    );
  }

  return (
    <FinanceiroLayout titulo="Nova Receita" voltar helpKey="financeiro-receita">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Km total rodado</label>
            <div className="flex items-center gap-2">
              <input type="number" inputMode="decimal" placeholder="0" value={kmTotal}
                onChange={e => setKmTotal(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-slate-500 text-sm">km</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Ganhos por App</p>
          <div className="flex flex-wrap gap-2">
            {APPS_PADRAO.map(({ id, label, cor }) => (
              <button key={id} onClick={() => adicionarApp(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${cor} active:scale-95 transition-transform`}>
                {label}
              </button>
            ))}
          </div>
          {linhasApp.map((linha, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                {linha.app === 'outro' ? (
                  <input type="text" placeholder="Nome do app" value={linha.appNome}
                    onChange={e => atualizarLinha(idx, 'appNome', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <span className="text-sm font-semibold text-slate-800">
                    {APPS_PADRAO.find(a => a.id === linha.app)?.label}
                  </span>
                )}
                <button onClick={() => removerLinha(idx)} className="text-red-400 hover:text-red-600 p-1 ml-2">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 min-w-0">
                <div className="flex items-center gap-1 flex-[2] min-w-0">
                  <span className="text-slate-400 text-sm flex-shrink-0">R$</span>
                  <input type="number" inputMode="decimal" placeholder="0,00" value={linha.valor}
                    onChange={e => atualizarLinha(idx, 'valor', e.target.value)}
                    className="min-w-0 flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-1 flex-[1] min-w-0">
                  <Hash size={14} className="text-slate-400 flex-shrink-0" />
                  <input type="number" inputMode="numeric" placeholder="corridas" value={linha.qtdCorridas}
                    onChange={e => atualizarLinha(idx, 'qtdCorridas', e.target.value)}
                    className="min-w-0 flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          ))}
          {linhasApp.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">Toque nos botões acima para adicionar apps</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Corrida Particular</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={valorParticular}
              onChange={e => setValorParticular(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {valorParticular && parseFloat(valorParticular) > 0 && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-600">Tipo</label>
                <select value={tipoParticular} onChange={e => setTipoParticular(e.target.value as TipoParticular)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TIPOS_PARTICULAR.map(t => <option key={t} value={t}>{LABEL_TIPO_PARTICULAR[t]}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Destino / Rota (ex: Hotel Laghetto → Aeroporto POA)"
                value={destinoParticular} onChange={e => setDestinoParticular(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-slate-400 flex-shrink-0" />
                <input type="number" inputMode="numeric" placeholder="Nº de corridas (opcional)"
                  value={qtdCorridasParticular} onChange={e => setQtdCorridasParticular(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={temPedagio} onChange={e => setTemPedagio(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-slate-700">Houve pedágio nesta corrida?</span>
          </label>
          {temPedagio && (
            <div className="flex items-center gap-2 ml-6">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={pedagioParticular}
                onChange={e => setPedagioParticular(e.target.value)}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-xs text-slate-400">(lançado automático como gasto)</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Gorjeta (opcional)</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={gorjeta}
              onChange={e => setGorjeta(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Comissão (opcional)</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={comissao}
              onChange={e => setComissao(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {comissao && parseFloat(comissao) > 0 && (
            <input type="text" placeholder="Descrição (ex: Hotel Serra Azul)" value={comissaoDescricao}
              onChange={e => setComissaoDescricao(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Observação (opcional)</label>
          <textarea rows={2} placeholder="Ex: dia chuvoso, evento na cidade..." value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

        <button onClick={handleSalvar} disabled={salvando}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
          <PlusCircle size={20} />
          {salvando ? 'Salvando...' : 'Salvar Receita'}
        </button>

      </div>
    </FinanceiroLayout>
  );
}
