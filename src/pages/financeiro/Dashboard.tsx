import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '@/hooks/financeiro/useDashboard';
import { useAgendamentosProximos } from '@/hooks/financeiro/useAgendamentos';
import { useMetaMensal } from '@/hooks/financeiro/useMetaMensal';
import { useReceitas } from '@/hooks/financeiro/useReceitas';
import { FinanceiroLayout } from './FinanceiroLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  formatarMoeda, formatarPercent, formatarKm,
  labelPeriodo, COR_APP, COR_CATEGORIA, LABEL_TIPO_AGENDAMENTO,
} from '@/utils/financeiro/formatters';
import type { PeriodoFiltro } from '@/integrations/firebase/types';
import { litrosTrabalho } from '@/utils/financeiro/calculos';
import { TrendingUp, TrendingDown, Wallet, Route, Percent, Gauge, ArrowUpRight, ArrowDownRight, Fuel, Calendar, Target, Hash } from 'lucide-react';

const PERIODOS: PeriodoFiltro[] = ['hoje', 'semana', 'mes', 'geral'];

interface KpiCardProps {
  icon?: React.ReactNode;
  label: string;
  valor: string;
  corValor: string;
  destaque?: boolean;
  subtitulo?: string;
}

function KpiCard({ icon, label, valor, corValor, destaque, subtitulo }: KpiCardProps) {
  return (
    <div className={`rounded-2xl p-3.5 shadow-sm flex flex-col gap-1 ${destaque ? 'bg-blue-50 col-span-2' : 'bg-white'}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <span className={`text-xl font-bold ${corValor}`}>{valor}</span>
      {subtitulo && <span className="text-xs text-slate-400">{subtitulo}</span>}
    </div>
  );
}

export default function FinanceiroDashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const { kpis, grafico, gastos, isLoading } = useDashboard(periodo);
  const agendamentosProximos = useAgendamentosProximos();
  const { meta, salvarMeta } = useMetaMensal();
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState('');

  const { receitas: receitasMes } = useReceitas('mes');

  if (isLoading || !kpis) {
    return (
      <FinanceiroLayout titulo="Financeiro" helpKey="financeiro-dashboard">
        <div className="text-center py-20 text-slate-400">Carregando...</div>
      </FinanceiroLayout>
    );
  }

  const corLucro = kpis.lucroLiquido >= 0 ? 'text-green-700' : 'text-red-600';

  const totalLitros = gastos
    .filter(g => g.categoria === 'combustivel' && g.litros && g.litros > 0)
    .reduce((acc, g) => acc + litrosTrabalho(g), 0);
  const consumoMedio = totalLitros > 0 && kpis.kmRodados > 0 ? kpis.kmRodados / totalLitros : null;

  const percentMeta = meta > 0 ? Math.min((kpis.receitaBruta / meta) * 100, 100) : 0;
  const metaAtingida = meta > 0 && kpis.receitaBruta >= meta;

  const hoje = new Date();
  const diasTrabalhados = new Set(receitasMes.map(r => new Date(r.data).toDateString())).size;
  const mediaDiaria = diasTrabalhados > 0 ? kpis.receitaBruta / diasTrabalhados : 0;
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = ultimoDiaMes - hoje.getDate();
  const previsao = mediaDiaria > 0 ? kpis.receitaBruta + mediaDiaria * diasRestantes : 0;
  const percentPrevisao = meta > 0 && previsao > 0 ? Math.min((previsao / meta) * 100, 100) : 0;
  const diasRestantesComHoje = ultimoDiaMes - hoje.getDate() + 1;
  const necessarioPorDia = meta > kpis.receitaBruta && diasRestantesComHoje > 0
    ? (meta - kpis.receitaBruta) / diasRestantesComHoje
    : 0;

  return (
    <FinanceiroLayout titulo="Financeiro" helpKey="financeiro-dashboard">
      <div className="flex flex-col gap-4">

        {agendamentosProximos.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
            <Calendar size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {agendamentosProximos.length === 1 ? '1 próximo compromisso' : `${agendamentosProximos.length} próximos compromissos`}
              </p>
              {agendamentosProximos.map(a => (
                <p key={`${a.id}-${a.quando}`} className="text-xs text-amber-700 mt-0.5 truncate">
                  {a.quando === 'hoje' ? 'Hoje' : 'Amanhã'} {a.hora} — {LABEL_TIPO_AGENDAMENTO[a.tipo]}{a.clienteNome ? ` · ${a.clienteNome}` : ''}
                </p>
              ))}
            </div>
            <button onClick={() => navigate('/financeiro/agenda')} className="text-xs text-amber-700 font-semibold underline flex-shrink-0">Ver</button>
          </div>
        )}

        <div className="flex gap-2">
          {PERIODOS.map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors
                ${periodo === p ? 'bg-blue-700 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              {labelPeriodo(p)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon={<TrendingUp size={20} className="text-green-600" />} label="Receita Bruta" valor={formatarMoeda(kpis.receitaBruta)} corValor="text-green-700" />
          <KpiCard icon={<TrendingDown size={20} className="text-red-500" />} label="Total Gastos" valor={formatarMoeda(kpis.totalGastos)} corValor="text-red-600" />
          <KpiCard icon={<Wallet size={20} className="text-blue-600" />} label="Lucro Líquido" valor={formatarMoeda(kpis.lucroLiquido)} corValor={corLucro} destaque />
          <KpiCard icon={<Route size={20} className="text-slate-500" />} label="Km Rodados" valor={formatarKm(kpis.kmRodados)} corValor="text-slate-700" />
          <KpiCard icon={<Percent size={20} className="text-orange-500" />} label="Gastos / Receita" valor={formatarPercent(kpis.percentGastos)} corValor={kpis.percentGastos > 50 ? 'text-red-600' : 'text-orange-600'} />
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <KpiCard icon={<ArrowUpRight size={18} className="text-green-500" />} label="Ganho/Km" valor={formatarMoeda(kpis.ganhoPorKm)} corValor="text-green-700" subtitulo="receita ÷ km" />
            <KpiCard icon={<Gauge size={18} className="text-purple-500" />} label="Lucro/Km" valor={formatarMoeda(kpis.lucroporKm)} corValor="text-purple-700" subtitulo="líquido ÷ km" />
            <KpiCard icon={<ArrowDownRight size={18} className="text-red-400" />} label="Custo/Km" valor={formatarMoeda(kpis.custoPorKm)} corValor="text-red-600" subtitulo="gastos ÷ km" />
          </div>
          {consumoMedio !== null && (
            <KpiCard icon={<Fuel size={20} className="text-orange-500" />} label="Consumo médio" valor={`${consumoMedio.toFixed(1)} km/L`} corValor="text-orange-600" subtitulo={`${kpis.kmRodados} km ÷ ${totalLitros.toFixed(1)} L`} />
          )}
          {kpis.totalCorridas > 0 && (
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <KpiCard icon={<Hash size={20} className="text-indigo-500" />} label="Corridas" valor={String(kpis.totalCorridas)} corValor="text-indigo-700" />
              <KpiCard icon={<Target size={20} className="text-teal-500" />} label="Receita/Corrida" valor={formatarMoeda(kpis.receitaMediaPorCorrida)} corValor="text-teal-700" subtitulo="média por corrida" />
            </div>
          )}
        </div>

        {periodo === 'mes' && meta > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Meta do mês</p>
              <button onClick={() => { setMetaInput(String(meta)); setEditandoMeta(true); }} className="text-xs text-blue-600 underline">Editar</button>
            </div>
            {editandoMeta ? (
              <div className="flex gap-2 mb-2">
                <input type="number" inputMode="decimal" placeholder="Meta em R$" value={metaInput} onChange={e => setMetaInput(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => { salvarMeta(parseFloat(metaInput) || 0); setEditandoMeta(false); }} className="bg-blue-700 text-white text-xs px-3 py-1.5 rounded-xl">OK</button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-2">
                {metaAtingida ? `Meta de ${formatarMoeda(meta)} atingida!` : `Faltam ${formatarMoeda(meta - kpis.receitaBruta)} de ${formatarMoeda(meta)}`}
              </p>
            )}
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              {previsao > 0 && !metaAtingida && <div className="absolute inset-y-0 left-0 rounded-full bg-blue-200" style={{ width: `${percentPrevisao}%` }} />}
              <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${metaAtingida ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentMeta}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs font-medium ${metaAtingida ? 'text-green-600' : 'text-blue-600'}`}>{percentMeta.toFixed(0)}% concluído</p>
              {previsao > 0 && !metaAtingida && <p className="text-xs text-slate-400">Previsão: {formatarMoeda(previsao)}</p>}
            </div>
            {diasTrabalhados > 0 && !metaAtingida && (
              <p className="text-xs text-slate-400 mt-0.5">{diasTrabalhados} dia{diasTrabalhados !== 1 ? 's' : ''} trabalhado{diasTrabalhados !== 1 ? 's' : ''} · média {formatarMoeda(mediaDiaria)}/dia</p>
            )}
            {necessarioPorDia > 0 && !metaAtingida && diasRestantesComHoje > 0 && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                Para bater a meta: <strong>{formatarMoeda(necessarioPorDia)}/dia</strong> nos próximos {diasRestantesComHoje} dia{diasRestantesComHoje !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {periodo === 'mes' && meta === 0 && !editandoMeta && (
          <button onClick={() => { setMetaInput(''); setEditandoMeta(true); }}
            className="w-full bg-white rounded-2xl p-3 shadow-sm border border-dashed border-slate-300 text-sm text-slate-400 flex items-center justify-center gap-2">
            <Target size={16} /> Definir meta mensal
          </button>
        )}
        {periodo === 'mes' && meta === 0 && editandoMeta && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-2">
            <input type="number" inputMode="decimal" placeholder="Meta mensal em R$" value={metaInput} onChange={e => setMetaInput(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={() => { salvarMeta(parseFloat(metaInput) || 0); setEditandoMeta(false); }} className="bg-blue-700 text-white text-sm px-4 rounded-xl">Salvar</button>
          </div>
        )}

        {grafico.some(d => d.receita > 0 || d.gasto > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Últimos 7 dias</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={grafico} barCategoryGap="30%">
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} width={40} />
                <Tooltip formatter={(value, name) => [formatarMoeda(Number(value)), name === 'receita' ? 'Receita' : 'Gasto']} />
                <Bar dataKey="receita" fill="#16a34a" radius={[4, 4, 0, 0]} name="receita" />
                <Bar dataKey="gasto" fill="#dc2626" radius={[4, 4, 0, 0]} name="gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {kpis.receitaPorApp.some(e => e.isApp) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Receita por App</p>
            <div className="flex flex-col gap-2">
              {kpis.receitaPorApp.filter(e => e.isApp).map((entry, i) => (
                <div key={entry.nome} className="rounded-xl p-3 flex flex-col gap-1"
                  style={{ background: `${COR_APP[entry.nome.toLowerCase()] ?? `hsl(${i * 60}, 65%, 50%)`}18` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ background: COR_APP[entry.nome.toLowerCase()] ?? `hsl(${i * 60}, 65%, 50%)` }} />
                      {entry.nome}
                    </span>
                    <span className="text-sm font-bold text-green-700">{formatarMoeda(entry.valor)}</span>
                  </div>
                  {entry.qtdCorridas > 0 && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 pl-4">
                      <span><span className="font-medium text-indigo-600">{entry.qtdCorridas}</span> corridas</span>
                      <span>·</span>
                      <span><span className="font-medium text-teal-600">{formatarMoeda(entry.receitaMedia)}</span>/corrida</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {kpis.receitaPorApp.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Distribuição de Receita</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={kpis.receitaPorApp} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={75} innerRadius={30}>
                  {kpis.receitaPorApp.map((entry, i) => (
                    <Cell key={i} fill={COR_APP[entry.nome.toLowerCase()] ?? `hsl(${i * 60}, 65%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatarMoeda(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-col gap-1">
              {kpis.receitaPorApp.map((entry, i) => (
                <div key={entry.nome} className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COR_APP[entry.nome.toLowerCase()] ?? `hsl(${i * 60}, 65%, 50%)` }} />
                  <span className="flex-1 text-sm text-slate-700">{entry.nome}</span>
                  <span className="text-sm font-medium text-green-700">{formatarMoeda(entry.valor)}</span>
                  <span className="text-xs text-slate-400 w-12 text-right">{formatarPercent(entry.percentual)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {kpis.gastosPorCategoria.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-2">Gastos por Categoria</p>
            {kpis.gastosPorCategoria.map(cat => (
              <div key={cat.categoria} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COR_CATEGORIA[cat.categoria.toLowerCase()] ?? '#6b7280' }} />
                <span className="flex-1 text-sm text-slate-700">{cat.categoria}</span>
                <span className="text-sm font-medium text-red-600">{formatarMoeda(cat.valor)}</span>
                <span className="text-xs text-slate-400 w-12 text-right">{formatarPercent(cat.percentual)}</span>
              </div>
            ))}
          </div>
        )}

        {kpis.receitaBruta === 0 && kpis.totalGastos === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-slate-600 font-medium">Nenhum registro ainda</p>
            <p className="text-slate-400 text-sm mt-1">Use o menu lateral para adicionar receitas e gastos</p>
          </div>
        )}

      </div>
    </FinanceiroLayout>
  );
}
