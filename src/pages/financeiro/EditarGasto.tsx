import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { buscarGastoPorId, atualizarGasto } from '@/integrations/firebase/financeiro';
import type { Gasto } from '@/integrations/firebase/types';
import { LABEL_CATEGORIA, formatarMoeda } from '@/utils/financeiro/formatters';

type Categoria = Gasto['categoria'];
const CATEGORIAS: { id: Categoria; label: string; emoji: string; cor: string }[] = [
  { id: 'combustivel', label: 'Combustível', emoji: '⛽', cor: 'bg-orange-100 border-orange-400 text-orange-700' },
  { id: 'manutencao', label: 'Manutenção', emoji: '🔧', cor: 'bg-purple-100 border-purple-400 text-purple-700' },
  { id: 'pedagio', label: 'Pedágio', emoji: '🛣️', cor: 'bg-cyan-100 border-cyan-400 text-cyan-700' },
  { id: 'outro', label: 'Outros', emoji: '📋', cor: 'bg-slate-100 border-slate-400 text-slate-700' },
];

export default function EditarGasto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [ehPedagioVinculado, setEhPedagioVinculado] = useState(false);
  const [categoria, setCategoria] = useState<Categoria>('combustivel');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [litros, setLitros] = useState('');
  const [kmTripB, setKmTripB] = useState('');
  const [kmPessoal, setKmPessoal] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const valorNum = parseFloat(valor) || 0;
  const kmTripBNum = parseFloat(kmTripB) || 0;
  const kmPessoalNum = parseFloat(kmPessoal) || 0;

  useEffect(() => {
    if (!id) return;
    buscarGastoPorId(id).then((g: Gasto | null) => {
      if (!g) { navigate('/financeiro/historico'); return; }
      setCategoria(g.categoria);
      setDescricao(g.descricao ?? '');
      setValor(String(g.valor));
      setData(g.data);
      setKmAtual(g.kmAtual ? String(g.kmAtual) : '');
      setLitros(g.litros ? String(g.litros) : '');
      setKmTripB(g.kmTripB ? String(g.kmTripB) : '');
      setKmPessoal(g.kmPessoal ? String(g.kmPessoal) : '');
      setObservacao(g.observacao ?? '');
      setEhPedagioVinculado(!!g.receitaId);
      setCarregando(false);
    });
  }, [id, navigate]);

  async function handleSalvar() {
    setErro('');
    if (!valor || parseFloat(valor) <= 0) { setErro('Informe o valor do gasto.'); return; }
    try {
      setSalvando(true);
      await atualizarGasto(id!, {
        categoria,
        descricao: descricao.trim() || LABEL_CATEGORIA[categoria],
        valor: parseFloat(valor),
        data,
        kmAtual: categoria === 'manutencao' && kmAtual ? parseFloat(kmAtual) : undefined,
        litros: categoria === 'combustivel' && litros ? parseFloat(litros) : undefined,
        kmTripB: categoria === 'combustivel' && kmTripB ? parseFloat(kmTripB) : undefined,
        kmPessoal: categoria === 'combustivel' && kmPessoal ? parseFloat(kmPessoal) : undefined,
        observacao: observacao || undefined,
      });
      setSucesso(true);
      setTimeout(() => navigate('/financeiro/historico'), 1200);
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <FinanceiroLayout titulo="Editar Gasto"><div className="text-center py-20 text-slate-400">Carregando...</div></FinanceiroLayout>;

  if (sucesso) return (
    <FinanceiroLayout titulo="Editar Gasto">
      <div className="flex flex-col items-center justify-center gap-4 mt-20">
        <CheckCircle size={56} className="text-green-600" />
        <p className="text-lg font-semibold text-green-700">Gasto atualizado!</p>
      </div>
    </FinanceiroLayout>
  );

  return (
    <FinanceiroLayout titulo="Editar Gasto" voltar>
      <div className="flex flex-col gap-4">
        {ehPedagioVinculado && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-700">
            Este pedágio foi gerado automaticamente a partir de uma receita. Edite o valor na receita original para mantê-los sincronizados.
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Categoria</p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => setCategoria(cat.id)} disabled={ehPedagioVinculado}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95
                  ${categoria === cat.id ? cat.cor + ' border-current' : 'bg-white border-slate-200 text-slate-500'}
                  ${ehPedagioVinculado ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span className="text-xl">{cat.emoji}</span>{cat.label}
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
                categoria === 'pedagio' ? 'Ex: Rodovia Anhanguera' : 'Ex: Comida no posto, lavagem...'}
              value={descricao} onChange={e => setDescricao(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Valor</label>
              <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-slate-400 text-sm">R$</span>
                <input type="number" inputMode="decimal" placeholder="0,00" value={valor}
                  onChange={e => setValor(e.target.value)} className="flex-1 focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-600">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {categoria === 'combustivel' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-600">Litros abastecidos <span className="text-slate-400 font-normal">(opcional)</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" placeholder="Ex: 40" value={litros} onChange={e => setLitros(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-500 text-sm">litros</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-600">Km do Trip B <span className="text-slate-400 font-normal">(opcional)</span></label>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="decimal" placeholder="Ex: 470" value={kmTripB} onChange={e => setKmTripB(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-slate-500 text-sm">km</span>
                </div>
              </div>
              {kmTripBNum > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-600">Km de uso pessoal <span className="text-slate-400 font-normal">(opcional)</span></label>
                  <div className="flex items-center gap-2">
                    <input type="number" inputMode="decimal" placeholder="Ex: 100" value={kmPessoal} onChange={e => setKmPessoal(e.target.value)}
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
                <input type="number" inputMode="decimal" placeholder="Ex: 52400" value={kmAtual} onChange={e => setKmAtual(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-slate-500 text-sm">km</span>
              </div>
            </div>
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
