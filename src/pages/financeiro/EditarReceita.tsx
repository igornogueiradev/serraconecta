import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2, CheckCircle, Hash } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { buscarReceitaPorId, atualizarReceita, deletarGasto, salvarGasto } from '@/integrations/firebase/financeiro';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import type { AppNome, GanhoPorApp, Receita, TipoParticular } from '@/integrations/firebase/types';
import { LABEL_TIPO_PARTICULAR } from '@/utils/financeiro/formatters';

const TIPOS_PARTICULAR: TipoParticular[] = ['particular', 'transfer', 'citytour', 'passeios', 'outro'];
const APPS_PADRAO: { id: AppNome; label: string; cor: string }[] = [
  { id: 'uber', label: 'Uber', cor: 'bg-black text-white' },
  { id: '99', label: '99', cor: 'bg-orange-500 text-white' },
  { id: 'blablacar', label: 'BlaBlaCar', cor: 'bg-blue-700 text-white' },
  { id: 'outro', label: '+ Outro', cor: 'bg-slate-200 text-slate-700' },
];

interface LinhaApp { app: AppNome; appNome: string; valor: string; qtdCorridas: string; }

export default function EditarReceita() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [data, setData] = useState('');
  const [kmTotal, setKmTotal] = useState('');
  const [linhasApp, setLinhasApp] = useState<LinhaApp[]>([]);
  const [valorParticular, setValorParticular] = useState('');
  const [tipoParticular, setTipoParticular] = useState<TipoParticular>('particular');
  const [destinoParticular, setDestinoParticular] = useState('');
  const [qtdCorridasParticular, setQtdCorridasParticular] = useState('');
  const [temPedagio, setTemPedagio] = useState(false);
  const [pedagioParticular, setPedagioParticular] = useState('');
  const [pedagioGastoId, setPedagioGastoId] = useState<string | undefined>();
  const [gorjeta, setGorjeta] = useState('');
  const [comissao, setComissao] = useState('');
  const [comissaoDescricao, setComissaoDescricao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id) return;
    buscarReceitaPorId(id).then(async (r: Receita | null) => {
      if (!r) { navigate('/financeiro/historico'); return; }
      setData(r.data);
      setKmTotal(String(r.kmTotal ?? ''));
      setLinhasApp(r.ganhosPorApp.map(g => ({
        app: g.app, appNome: g.appNome ?? '',
        valor: String(g.valor),
        qtdCorridas: g.qtdCorridas ? String(g.qtdCorridas) : '',
      })));
      setValorParticular(r.valorParticular ? String(r.valorParticular) : '');
      if (r.tipoParticular) setTipoParticular(r.tipoParticular);
      setDestinoParticular(r.destinoParticular ?? '');
      setQtdCorridasParticular(r.qtdCorridas ? String(r.qtdCorridas) : '');
      setGorjeta(r.gorjeta ? String(r.gorjeta) : '');
      setComissao(r.comissao ? String(r.comissao) : '');
      setComissaoDescricao(r.comissaoDescricao ?? '');
      setObservacao(r.observacao ?? '');

      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await getDocs(query(
          collection(db, 'gastos'),
          where('user_id', '==', uid),
          where('receitaId', '==', id)
        ));
        const gp = snap.docs[0];
        if (gp) {
          setTemPedagio(true);
          setPedagioParticular(String(gp.data().valor));
          setPedagioGastoId(gp.id);
        } else if (r.pedagioParticular) {
          setTemPedagio(true);
          setPedagioParticular(String(r.pedagioParticular));
        }
      }
      setCarregando(false);
    });
  }, [id, navigate]);

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
    if (!ganhosPorApp.length && !(vParticular && vParticular > 0)) { setErro('Informe pelo menos um valor de receita.'); return; }
    if (!kmTotal || parseFloat(kmTotal) < 0) { setErro('Informe o km total rodado.'); return; }

    const novoPedagio = temPedagio && pedagioParticular ? parseFloat(pedagioParticular) : undefined;

    try {
      setSalvando(true);
      await atualizarReceita(id!, {
        data, kmTotal: parseFloat(kmTotal), ganhosPorApp,
        valorParticular: vParticular, pedagioParticular: novoPedagio,
        tipoParticular: vParticular && vParticular > 0 ? tipoParticular : undefined,
        destinoParticular: destinoParticular || undefined,
        qtdCorridas: qtdCorridasParticular ? parseInt(qtdCorridasParticular) : undefined,
        gorjeta: gorjeta ? parseFloat(gorjeta) : undefined,
        comissao: comissao ? parseFloat(comissao) : undefined,
        comissaoDescricao: comissaoDescricao || undefined,
        observacao: observacao || undefined,
      });

      if (pedagioGastoId) {
        if (novoPedagio && novoPedagio > 0) {
          await atualizarReceita(pedagioGastoId, { data });
        } else {
          await deletarGasto(pedagioGastoId);
        }
      } else if (novoPedagio && novoPedagio > 0) {
        await salvarGasto({ categoria: 'pedagio', descricao: 'Pedágio — corrida particular', valor: novoPedagio, data, receitaId: id! });
      }

      setSucesso(true);
      setTimeout(() => navigate('/financeiro/historico'), 1200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <FinanceiroLayout titulo="Editar Receita"><div className="text-center py-20 text-slate-400">Carregando...</div></FinanceiroLayout>;

  if (sucesso) return (
    <FinanceiroLayout titulo="Editar Receita">
      <div className="flex flex-col items-center justify-center gap-4 mt-20">
        <CheckCircle size={56} className="text-green-600" />
        <p className="text-lg font-semibold text-green-700">Receita atualizada!</p>
      </div>
    </FinanceiroLayout>
  );

  return (
    <FinanceiroLayout titulo="Editar Receita" voltar>
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
              <input type="number" inputMode="decimal" placeholder="0" value={kmTotal} onChange={e => setKmTotal(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-slate-500 text-sm">km</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Ganhos por App</p>
          <div className="flex flex-wrap gap-2">
            {APPS_PADRAO.map(({ id: aid, label, cor }) => (
              <button key={aid} onClick={() => adicionarApp(aid)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${cor} active:scale-95 transition-transform`}>{label}</button>
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
                  <span className="text-sm font-semibold text-slate-800">{APPS_PADRAO.find(a => a.id === linha.app)?.label}</span>
                )}
                <button onClick={() => removerLinha(idx)} className="text-red-400 hover:text-red-600 p-1 ml-2"><Trash2 size={16} /></button>
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
              <select value={tipoParticular} onChange={e => setTipoParticular(e.target.value as TipoParticular)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS_PARTICULAR.map(t => <option key={t} value={t}>{LABEL_TIPO_PARTICULAR[t]}</option>)}
              </select>
              <input type="text" placeholder="Destino / Rota" value={destinoParticular}
                onChange={e => setDestinoParticular(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-slate-400" />
                <input type="number" inputMode="numeric" placeholder="Nº de corridas" value={qtdCorridasParticular}
                  onChange={e => setQtdCorridasParticular(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={temPedagio} onChange={e => setTemPedagio(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-slate-700">Houve pedágio?</span>
          </label>
          {temPedagio && (
            <div className="flex items-center gap-2 ml-6">
              <span className="text-slate-400 text-sm">R$</span>
              <input type="number" inputMode="decimal" placeholder="0,00" value={pedagioParticular}
                onChange={e => setPedagioParticular(e.target.value)}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-xs text-slate-400">(gasto vinculado)</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Gorjeta (opcional)</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={gorjeta} onChange={e => setGorjeta(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Comissão (opcional)</p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" inputMode="decimal" placeholder="0,00" value={comissao} onChange={e => setComissao(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {comissao && parseFloat(comissao) > 0 && (
            <input type="text" placeholder="Descrição" value={comissaoDescricao} onChange={e => setComissaoDescricao(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Observação (opcional)</label>
          <textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

        <button onClick={handleSalvar} disabled={salvando}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
          <Save size={20} />
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </FinanceiroLayout>
  );
}
