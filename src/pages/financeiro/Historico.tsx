import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTodasReceitas } from '@/hooks/financeiro/useReceitas';
import { useTodosGastos } from '@/hooks/financeiro/useGastos';
import { deletarReceita, deletarGasto } from '@/integrations/firebase/financeiro';
import { FinanceiroLayout } from './FinanceiroLayout';
import { formatarMoeda, formatarData, LABEL_APP, LABEL_CATEGORIA, LABEL_TIPO_PARTICULAR } from '@/utils/financeiro/formatters';
import { Trash2, Pencil, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import type { Receita, Gasto } from '@/integrations/firebase/types';

type FiltroTipo = 'todos' | 'receita' | 'gasto';
type ItemUnificado =
  | { tipo: 'receita'; data: Date; item: Receita }
  | { tipo: 'gasto'; data: Date; item: Gasto };

export default function Historico() {
  const navigate = useNavigate();
  const { receitas, refetch: refetchR } = useTodasReceitas();
  const { gastos, refetch: refetchG } = useTodosGastos();
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);

  const itens: ItemUnificado[] = [
    ...receitas.map(r => ({ tipo: 'receita' as const, data: new Date(r.data + 'T12:00:00'), item: r })),
    ...gastos.map(g => ({ tipo: 'gasto' as const, data: new Date(g.data + 'T12:00:00'), item: g })),
  ]
    .filter(i => filtro === 'todos' || i.tipo === filtro)
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  async function confirmarDelete(tipo: 'receita' | 'gasto', id: string) {
    setDeletando(true);
    try {
      if (tipo === 'receita') await deletarReceita(id);
      else await deletarGasto(id);
      setConfirmandoId(null);
      setExpandidoId(null);
      refetchR();
      refetchG();
    } finally {
      setDeletando(false);
    }
  }

  function totalReceita(r: Receita): number {
    return r.ganhosPorApp.reduce((s, g) => s + g.valor, 0) + (r.valorParticular ?? 0) + (r.gorjeta ?? 0) + (r.comissao ?? 0);
  }

  return (
    <FinanceiroLayout titulo="Histórico" helpKey="financeiro-historico">
      <div className="flex gap-2 mb-4">
        {(['todos', 'receita', 'gasto'] as FiltroTipo[]).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
              ${filtro === f
                ? f === 'receita' ? 'bg-green-600 text-white'
                : f === 'gasto' ? 'bg-red-600 text-white'
                : 'bg-blue-700 text-white'
                : 'bg-white text-slate-600'}`}>
            {f === 'todos' ? 'Todos' : f === 'receita' ? 'Receitas' : 'Gastos'}
          </button>
        ))}
      </div>

      {itens.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-slate-500">Nenhum registro encontrado</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {itens.map(({ tipo, data, item }) => {
          const uid = `${tipo}-${item.id}`;
          const expandido = expandidoId === uid;
          const confirmando = confirmandoId === uid;

          return (
            <div key={uid} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpandidoId(expandido ? null : uid)}>
                <div className={`p-2 rounded-xl ${tipo === 'receita' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tipo === 'receita'
                    ? <TrendingUp size={18} className="text-green-600" />
                    : <TrendingDown size={18} className="text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {tipo === 'receita'
                      ? `Receita — ${formatarData(data)}`
                      : (item as Gasto).descricao}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tipo === 'receita'
                      ? (item as Receita).ganhosPorApp.map(g =>
                          g.app === 'outro' ? (g.appNome ?? 'Outro') : LABEL_APP[g.app]
                        ).join(', ') + ((item as Receita).valorParticular ? ' + Particular' : '')
                      : `${LABEL_CATEGORIA[(item as Gasto).categoria]} · ${formatarData(data)}`}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tipo === 'receita' ? 'text-green-700' : 'text-red-600'}`}>
                  {tipo === 'receita'
                    ? `+${formatarMoeda(totalReceita(item as Receita))}`
                    : `-${formatarMoeda((item as Gasto).valor)}`}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
              </button>

              {expandido && (
                <div className="px-4 pb-3 border-t border-slate-100">
                  {tipo === 'receita' && (() => {
                    const r = item as Receita;
                    return (
                      <div className="py-2 flex flex-col gap-1 text-sm text-slate-600">
                        {r.ganhosPorApp.map((g, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{g.app === 'outro' ? (g.appNome ?? 'Outro') : LABEL_APP[g.app]}</span>
                            <span className="text-green-700 font-medium">
                              {formatarMoeda(g.valor)}
                              {g.qtdCorridas && g.qtdCorridas > 0 && <span className="text-slate-400 font-normal text-xs ml-1">({g.qtdCorridas} corridas)</span>}
                            </span>
                          </div>
                        ))}
                        {r.valorParticular && (
                          <div className="flex justify-between">
                            <span>{r.tipoParticular ? (LABEL_TIPO_PARTICULAR[r.tipoParticular] ?? 'Particular') : 'Particular'}</span>
                            <span className="text-green-700 font-medium">{formatarMoeda(r.valorParticular)}</span>
                          </div>
                        )}
                        {r.destinoParticular && (
                          <div className="flex justify-between text-slate-500">
                            <span>Rota</span><span className="text-right max-w-[60%]">{r.destinoParticular}</span>
                          </div>
                        )}
                        {r.gorjeta && <div className="flex justify-between"><span>Gorjeta</span><span className="text-green-700 font-medium">{formatarMoeda(r.gorjeta)}</span></div>}
                        {r.comissao && <div className="flex justify-between"><span>Comissão{r.comissaoDescricao ? ` — ${r.comissaoDescricao}` : ''}</span><span className="text-green-700 font-medium">{formatarMoeda(r.comissao)}</span></div>}
                        {r.kmTotal > 0 && <div className="flex justify-between text-slate-500"><span>Km rodados</span><span>{r.kmTotal} km</span></div>}
                        {r.observacao && <p className="text-slate-400 text-xs italic mt-1">{r.observacao}</p>}
                      </div>
                    );
                  })()}

                  {tipo === 'gasto' && (() => {
                    const g = item as Gasto;
                    return (
                      <div className="py-2 flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex justify-between"><span>Categoria</span><span>{LABEL_CATEGORIA[g.categoria]}</span></div>
                        <div className="flex justify-between"><span>Valor</span><span className="text-red-600 font-medium">{formatarMoeda(g.valor)}</span></div>
                        {g.kmTripB && g.kmPessoal && g.kmPessoal > 0 && (
                          <>
                            <div className="flex justify-between text-slate-500"><span>Trip B</span><span>{g.kmTripB} km</span></div>
                            <div className="flex justify-between text-slate-500"><span>Uso pessoal</span><span>{g.kmPessoal} km ({((g.kmPessoal / g.kmTripB) * 100).toFixed(1)}%)</span></div>
                            <div className="flex justify-between font-medium text-red-600"><span>Custo trabalho (KPIs)</span><span>{formatarMoeda(g.valor * (1 - g.kmPessoal / g.kmTripB))}</span></div>
                          </>
                        )}
                        {g.kmAtual && <div className="flex justify-between text-slate-500"><span>Odômetro</span><span>{g.kmAtual.toLocaleString('pt-BR')} km</span></div>}
                        {g.observacao && <p className="text-slate-400 text-xs italic mt-1">{g.observacao}</p>}
                      </div>
                    );
                  })()}

                  {!confirmando ? (
                    <div className="mt-2 flex gap-3">
                      <button
                        onClick={() => navigate(tipo === 'receita' ? `/financeiro/editar-receita/${item.id}` : `/financeiro/editar-gasto/${item.id}`)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 py-1">
                        <Pencil size={14} /> Editar
                      </button>
                      <button onClick={() => setConfirmandoId(uid)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 py-1">
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => confirmarDelete(tipo, item.id!)} disabled={deletando}
                        className="flex-1 bg-red-600 text-white text-xs py-2 rounded-xl font-medium disabled:opacity-60">
                        Confirmar exclusão
                      </button>
                      <button onClick={() => setConfirmandoId(null)}
                        className="flex-1 bg-slate-100 text-slate-700 text-xs py-2 rounded-xl font-medium">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FinanceiroLayout>
  );
}
