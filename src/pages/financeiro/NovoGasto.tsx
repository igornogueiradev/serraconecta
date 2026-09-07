import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinusCircle, CheckCircle } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { salvarGasto } from '@/integrations/firebase/financeiro';
import type { Gasto } from '@/integrations/firebase/types';
import { LABEL_CATEGORIA, formatarMoeda } from '@/utils/financeiro/formatters';
import { format, addMonths } from 'date-fns';

type Categoria = Gasto['categoria'];

const CATEGORIAS: { id: Categoria; label: string; emoji: string; cor: string }[] = [
  { id: 'combustivel', label: 'Combustível', emoji: '⛽', cor: 'bg-orange-100 border-orange-400 text-orange-700' },
  { id: 'manutencao', label: 'Manutenção', emoji: '🔧', cor: 'bg-purple-100 border-purple-400 text-purple-700' },
  { id: 'pedagio', label: 'Pedágio', emoji: '🛣️', cor: 'bg-cyan-100 border-cyan-400 text-cyan-700' },
  { id: 'outro', label: 'Outros', emoji: '📋', cor: 'bg-slate-100 border-slate-400 text-slate-700' },
];

export default function NovoGasto() {
  const navigate = useNavigate();
  const hoje = format(new Date(), 'yyyy-MM-dd');

  const [categoria, setCategoria] = useState<Categoria>('combustivel');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(hoje);
  const [kmAtual, setKmAtual] = useState('');
  const [litros, setLitros] = useState('');
  const [observacao, setObservacao] = useState('');
  const [kmTripB, setKmTripB] = useState('');
  const [kmPessoal, setKmPessoal] = useState('');
  const [parcelado, setParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState(2);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const valorNum = parseFloat(valor) || 0;
  const kmTripBNum = parseFloat(kmTripB) || 0;
  const kmPessoalNum = parseFloat(kmPessoal) || 0;

  async function handleSalvar() {
    setErro('');
    if (!valor || parseFloat(valor) <= 0) { setErro('Informe o valor do gasto.'); return; }

    const total = parseFloat(valor);
    const base = descricao.trim() || LABEL_CATEGORIA[categoria];
    const baseDate = new Date(data + 'T12:00:00');

    try {
      setSalvando(true);
      if (!parcelado) {
        await salvarGasto({
          categoria,
          descricao: base,
          valor: total,
          data,
          kmAtual: categoria === 'manutencao' && kmAtual ? parseFloat(kmAtual) : undefined,
          litros: categoria === 'combustivel' && litros ? parseFloat(litros) : undefined,
          kmTripB: categoria === 'combustivel' && kmTripB ? parseFloat(kmTripB) : undefined,
          kmPessoal: categoria === 'combustivel' && kmPessoal ? parseFloat(kmPessoal) : undefined,
          observacao: observacao || undefined,
        });
      } else {
        const valorParcela = Math.floor((total / numParcelas) * 100) / 100;
        for (let i = 0; i < numParcelas; i++) {
          const valorEsta = i === numParcelas - 1
            ? Math.round((total - valorParcela * (numParcelas - 1)) * 100) / 100
            : valorParcela;
          const dataParcela = format(addMonths(baseDate, i), 'yyyy-MM-dd');
          await salvarGasto({
            categoria,
            descricao: `${base} ${i + 1}/${numParcelas}`,
            valor: valorEsta,
            data: dataParcela,
            kmAtual: i === 0 && categoria === 'manutencao' && kmAtual ? parseFloat(kmAtual) : undefined,
            litros: i === 0 && categoria === 'combustivel' && litros ? parseFloat(litros) : undefined,
            kmTripB: i === 0 && categoria === 'combustivel' && kmTripB ? parseFloat(kmTripB) : undefined,
            kmPessoal: i === 0 && categoria === 'combustivel' && kmPessoal ? parseFloat(kmPessoal) : undefined,
            observacao: observacao || undefined,
          });
        }
      }
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
      <FinanceiroLayout titulo="Novo Gasto">
        <div className="flex flex-col items-center justify-center gap-4 mt-20">
          <CheckCircle size={56} className="text-green-600" />
          <p className="text-lg font-semibold text-green-700">
            {parcelado ? `${numParcelas} parcelas salvas!` : 'Gasto salvo!'}
          </p>
        </div>
      </FinanceiroLayout>
    );
  }

  return (
    <FinanceiroLayout titulo="Novo Gasto" voltar helpKey="financeiro-gasto">
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Categoria</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => setCategoria(cat.id)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95
                  ${categoria === cat.id ? cat.cor + ' border-current' : 'bg-white border-slate-200 text-slate-500'}`}>
                <span className="text-xl">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Descrição <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input type="text"
              placeholder={
                categoria === 'combustivel' ? 'Ex: Gasolina comum, Shell...' :
                categoria === 'manutencao' ? 'Ex: Troca de óleo, revisão 10.000km' :
                categoria === 'pedagio' ? 'Ex: Rodovia Anhanguera' :
                'Ex: Comida no posto, lavagem...'
              }
              value={descricao} onChange={e => setDescricao(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Valor total</label>
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-slate-400 text-sm">R$</span>
                <input type="number" inputMode="decimal" placeholder="0,00" value={valor}
                  onChange={e => setValor(e.target.value)} className="flex-1 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">{parcelado ? 'Data da 1ª parcela' : 'Data'}</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={parcelado} onChange={e => setParcelado(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-slate-700">Valor parcelado?</span>
          </label>

          {parcelado && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 flex-shrink-0">Nº de parcelas</span>
              <select value={numParcelas} onChange={e => setNumParcelas(Number(e.target.value))}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                  <option key={n} value={n}>{n}x de {formatarMoeda(valorNum > 0 ? valorNum / n : 0)}</option>
                ))}
              </select>
            </div>
          )}

          {categoria === 'combustivel' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-600">Litros abastecidos <span className="text-slate-400 font-normal">(opcional)</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" placeholder="Ex: 40" value={litros}
                    onChange={e => setLitros(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-500 text-sm">litros</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-600">Km do Trip B <span className="text-slate-400 font-normal">(opcional)</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" placeholder="Ex: 470" value={kmTripB}
                    onChange={e => setKmTripB(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-500 text-sm">km</span>
                </div>
              </div>
              {kmTripBNum > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-600">Km de uso pessoal <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <div className="flex items-center gap-2">
                    <input type="number" inputMode="decimal" placeholder="Ex: 100" value={kmPessoal}
                      onChange={e => setKmPessoal(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-slate-500 text-sm">km</span>
                  </div>
                </div>
              )}
              {kmTripBNum > 0 && kmPessoalNum > 0 && kmPessoalNum < kmTripBNum && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                  Uso pessoal: {((kmPessoalNum / kmTripBNum) * 100).toFixed(1)}% →{' '}
                  <strong>{formatarMoeda(valorNum * kmPessoalNum / kmTripBNum)}</strong> excluídos dos KPIs
                </div>
              )}
            </>
          )}

          {categoria === 'manutencao' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Km atual (odômetro) <span className="text-slate-400 font-normal">(opcional)</span></label>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="decimal" placeholder="Ex: 52400" value={kmAtual}
                  onChange={e => setKmAtual(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-slate-500 text-sm">km</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-slate-600">Observação (opcional)</label>
          <textarea rows={2} placeholder="Detalhes adicionais..." value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

        <button onClick={handleSalvar} disabled={salvando}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
          <MinusCircle size={20} />
          {salvando ? 'Salvando...' : parcelado ? `Salvar ${numParcelas} parcelas` : 'Salvar Gasto'}
        </button>

      </div>
    </FinanceiroLayout>
  );
}
