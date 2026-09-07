import { useState } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';
import { useTodasReceitas } from '@/hooks/financeiro/useReceitas';
import { useTodosGastos } from '@/hooks/financeiro/useGastos';
import { calcularKpis, melhorDiaSemana, agruparPorMes } from '@/utils/financeiro/calculos';
import { useMetaMensal } from '@/hooks/financeiro/useMetaMensal';
import { formatarMoeda, formatarPercent, formatarKm, COR_CATEGORIA } from '@/utils/financeiro/formatters';
import { FinanceiroLayout } from './FinanceiroLayout';
import { Download, Upload, Trophy, TrendingUp, TrendingDown, Wallet, Route, Fuel, ArrowUpRight, ArrowDownRight, Gauge, Target, Hash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Relatorios() {
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth());
  const [ano, setAno] = useState(agora.getFullYear());
  const [mostrarGeral, setMostrarGeral] = useState(false);
  const [msgBackup, setMsgBackup] = useState('');
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState('');
  const { meta, salvarMeta } = useMetaMensal();

  const { receitas: todasReceitas, refetch: refetchR } = useTodasReceitas();
  const { gastos: todosGastos, refetch: refetchG } = useTodosGastos();

  const receitasMes = todasReceitas.filter(r => {
    const d = new Date(r.data);
    return d.getMonth() === mes && d.getFullYear() === ano;
  });
  const gastosMes = todosGastos.filter(g => {
    const d = new Date(g.data);
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  const receitas = mostrarGeral ? todasReceitas : receitasMes;
  const gastos = mostrarGeral ? todosGastos : gastosMes;

  const kpis = calcularKpis(receitas, gastos);
  const melhorDia = melhorDiaSemana(receitas, gastos);

  const totalLitros = gastos
    .filter(g => g.categoria === 'combustivel' && g.litros && g.litros > 0)
    .reduce((acc, g) => acc + (g.litros ?? 0), 0);
  const consumoMedio = totalLitros > 0 && kpis.kmRodados > 0
    ? kpis.kmRodados / totalLitros
    : null;

  const percentMeta = !mostrarGeral && meta > 0 ? Math.min((kpis.receitaBruta / meta) * 100, 100) : 0;
  const metaAtingida = !mostrarGeral && meta > 0 && kpis.receitaBruta >= meta;

  const dadosSeisMeses = agruparPorMes(todasReceitas, todosGastos, 6);
  const anos = Array.from({ length: 3 }, (_, i) => agora.getFullYear() - i);

  function handleExportar() {
    const dados = {
      receitas: todasReceitas,
      gastos: todosGastos,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serraconecta-financeiro-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsgBackup('Backup exportado!');
    setTimeout(() => setMsgBackup(''), 3000);
  }

  async function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dados = JSON.parse(text);
      const user = auth.currentUser;
      if (!user) { setMsgBackup('Faça login para importar.'); return; }

      const agora = new Date().toISOString();
      // Firestore batch tem limite de 500 ops — divide se necessário
      const receitas = dados.receitas ?? [];
      const gastos = dados.gastos ?? [];
      const todos = [...receitas.map((r: Record<string, unknown>) => ({ col: 'receitas', doc: r })),
                     ...gastos.map((g: Record<string, unknown>) => ({ col: 'gastos', doc: g }))];

      for (let i = 0; i < todos.length; i += 400) {
        const batch = writeBatch(db);
        for (const { col, doc: rawDoc } of todos.slice(i, i + 400)) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, receitaId: _receitaId, ...rest } = rawDoc as Record<string, unknown>;
          // Normaliza data: "2026-04-01T12:00:00.000Z" ou Date → "2026-04-01"
          const data = String(rest.data).slice(0, 10);
          batch.set(doc(collection(db, col)), { ...rest, data, user_id: user.uid, created_at: agora });
        }
        await batch.commit();
      }

      refetchR();
      refetchG();
      setMsgBackup(`Importados ${receitas.length} receita(s) e ${gastos.length} gasto(s)!`);
    } catch {
      setMsgBackup('Erro ao importar. Verifique o arquivo.');
    }
    setTimeout(() => setMsgBackup(''), 5000);
    e.target.value = '';
  }

  return (
    <FinanceiroLayout titulo="Relatórios" helpKey="financeiro-relatorios">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex gap-2">
            <select value={mes}
              onChange={e => { setMes(Number(e.target.value)); setMostrarGeral(false); }}
              disabled={mostrarGeral}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
              {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={ano}
              onChange={e => { setAno(Number(e.target.value)); setMostrarGeral(false); }}
              disabled={mostrarGeral}
              className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => setMostrarGeral(g => !g)}
            className={`w-full py-2 rounded-xl text-sm font-medium transition-colors
              ${mostrarGeral ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {mostrarGeral ? '✓ Geral — todo o histórico' : 'Ver todo o histórico (Geral)'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">
            {mostrarGeral ? 'Resumo — Todo o histórico' : `Resumo — ${MESES[mes]} ${ano}`}
          </p>
          <div className="flex flex-col gap-2">
            <LinhaSumario icon={<TrendingUp size={16} className="text-green-600" />} label="Receita Bruta" valor={formatarMoeda(kpis.receitaBruta)} cor="text-green-700" />
            <LinhaSumario icon={<TrendingDown size={16} className="text-red-500" />} label="Total Gastos" valor={formatarMoeda(kpis.totalGastos)} cor="text-red-600" />
            <div className="border-t border-slate-100 my-1" />
            <LinhaSumario icon={<Wallet size={16} className="text-blue-600" />} label="Lucro Líquido" valor={formatarMoeda(kpis.lucroLiquido)} cor={kpis.lucroLiquido >= 0 ? 'text-blue-700' : 'text-red-700'} negrito />
            <LinhaSumario icon={<Route size={16} className="text-slate-500" />} label="Km Rodados" valor={formatarKm(kpis.kmRodados)} cor="text-slate-700" />
            <LinhaSumario label="% Gastos / Receita" valor={formatarPercent(kpis.percentGastos)} cor={kpis.percentGastos > 50 ? 'text-red-600' : 'text-orange-600'} />
            <div className="border-t border-slate-100 my-1" />
            <LinhaSumario icon={<ArrowUpRight size={16} className="text-green-500" />} label="Ganho por Km" valor={formatarMoeda(kpis.ganhoPorKm)} cor="text-green-700" subtitulo="receita bruta ÷ km" />
            <LinhaSumario icon={<Gauge size={16} className="text-purple-500" />} label="Lucro por Km" valor={formatarMoeda(kpis.lucroporKm)} cor="text-purple-700" subtitulo="lucro líquido ÷ km" />
            <LinhaSumario icon={<ArrowDownRight size={16} className="text-red-400" />} label="Custo por Km" valor={formatarMoeda(kpis.custoPorKm)} cor="text-red-600" subtitulo="gastos totais ÷ km" />
            {consumoMedio !== null && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <LinhaSumario icon={<Fuel size={16} className="text-orange-500" />} label="Consumo médio do carro"
                  valor={`${consumoMedio.toFixed(1)} km/L`} cor="text-orange-600" />
                <p className="text-xs text-slate-400 ml-5">
                  {kpis.kmRodados.toLocaleString('pt-BR')} km ÷ {totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L abastecidos
                </p>
              </>
            )}
            {kpis.totalCorridas > 0 && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <LinhaSumario icon={<Hash size={16} className="text-indigo-500" />} label="Total de corridas" valor={String(kpis.totalCorridas)} cor="text-indigo-700" />
                <LinhaSumario icon={<Target size={16} className="text-teal-500" />} label="Receita média/corrida" valor={formatarMoeda(kpis.receitaMediaPorCorrida)} cor="text-teal-700" />
              </>
            )}
          </div>
        </div>

        {!mostrarGeral && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Target size={15} className="text-blue-600" /> Meta do mês
              </p>
              {meta > 0 && !editandoMeta && (
                <button onClick={() => { setMetaInput(String(meta)); setEditandoMeta(true); }}
                  className="text-xs text-blue-600 underline">Editar</button>
              )}
            </div>
            {editandoMeta || meta === 0 ? (
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" placeholder="Meta mensal em R$"
                  value={metaInput} onChange={e => setMetaInput(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => { salvarMeta(parseFloat(metaInput) || 0); setEditandoMeta(false); }}
                  className="bg-blue-700 text-white text-xs px-3 rounded-xl">Salvar</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-2">
                  {metaAtingida
                    ? `Meta de ${formatarMoeda(meta)} atingida!`
                    : `${formatarMoeda(kpis.receitaBruta)} de ${formatarMoeda(meta)} — faltam ${formatarMoeda(meta - kpis.receitaBruta)}`}
                </p>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${metaAtingida ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${percentMeta}%` }} />
                </div>
                <p className={`text-xs mt-1 text-right font-medium ${metaAtingida ? 'text-green-600' : 'text-blue-600'}`}>
                  {percentMeta.toFixed(0)}%
                </p>
              </>
            )}
          </div>
        )}

        {dadosSeisMeses.some(d => d.receita > 0 || d.gasto > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Evolução — últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dadosSeisMeses} barCategoryGap="30%">
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={38} />
                <Tooltip formatter={(value, name) => [formatarMoeda(Number(value)), name === 'receita' ? 'Receita' : 'Gasto']} />
                <Bar dataKey="receita" fill="#16a34a" radius={[4, 4, 0, 0]} name="receita" />
                <Bar dataKey="gasto" fill="#dc2626" radius={[4, 4, 0, 0]} name="gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {melhorDia !== '—' && (
          <div className="bg-amber-50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <Trophy size={24} className="text-amber-500" />
            <div>
              <p className="text-xs text-amber-700 font-medium">Melhor dia da semana</p>
              <p className="text-lg font-bold text-amber-800">{melhorDia}</p>
            </div>
          </div>
        )}

        {kpis.receitaPorApp.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Receita por App</p>
            {kpis.receitaPorApp.map(app => (
              <div key={app.nome} className="mb-2">
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-slate-700">{app.nome}</span>
                  <span className="font-medium text-green-700">
                    {formatarMoeda(app.valor)} <span className="text-slate-400 font-normal">({formatarPercent(app.percentual)})</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(app.percentual, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {kpis.gastosPorCategoria.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-700 mb-3">Gastos por Categoria</p>
            {kpis.gastosPorCategoria.map(cat => (
              <div key={cat.categoria} className="mb-2">
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-slate-700">{cat.categoria}</span>
                  <span className="font-medium text-red-600">
                    {formatarMoeda(cat.valor)} <span className="text-slate-400 font-normal">({formatarPercent(cat.percentual)})</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(cat.percentual, 100)}%`, background: COR_CATEGORIA[cat.categoria.toLowerCase()] ?? '#6b7280' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {kpis.receitaBruta === 0 && kpis.totalGastos === 0 && !mostrarGeral && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-slate-400">Nenhum registro em {MESES[mes]} {ano}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3">Backup dos Dados</p>
          <div className="flex gap-2">
            <button onClick={handleExportar}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium active:bg-blue-800">
              <Download size={16} /> Exportar JSON
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-medium cursor-pointer active:bg-slate-200">
              <Upload size={16} /> Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImportar} />
            </label>
          </div>
          {msgBackup && <p className="text-xs text-center mt-2 text-blue-700">{msgBackup}</p>}
        </div>

      </div>
    </FinanceiroLayout>
  );
}

interface LinhaSumarioProps {
  icon?: React.ReactNode;
  label: string;
  valor: string;
  cor: string;
  negrito?: boolean;
  subtitulo?: string;
}

function LinhaSumario({ icon, label, valor, cor, negrito, subtitulo }: LinhaSumarioProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon}
        <div className="flex flex-col">
          <span className={`text-sm ${negrito ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{label}</span>
          {subtitulo && <span className="text-xs text-slate-400">{subtitulo}</span>}
        </div>
      </div>
      <span className={`text-sm ${negrito ? 'font-bold text-base' : 'font-medium'} ${cor} ml-2 flex-shrink-0`}>{valor}</span>
    </div>
  );
}
