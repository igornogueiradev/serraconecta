import { useState } from 'react';
import { UserPlus, Copy, Send, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react';
import { FinanceiroLayout } from './FinanceiroLayout';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useAgendamentos } from '@/hooks/financeiro/useAgendamentos';
import { useToast } from '@/hooks/use-toast';
import {
  criarMotorista, atualizarMotorista, excluirMotorista, gerarNovoLink,
  linkAgendaMotorista, sincronizarAgendasMotoristas,
} from '@/integrations/firebase/motoristas';
import { linkWhatsApp } from '@/utils/whatsapp';
import type { Motorista } from '@/integrations/firebase/types';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Motoristas() {
  const { motoristas, isLoading, refetch } = useMotoristas();
  const { agendamentos, isLoading: carregandoAgenda } = useAgendamentos();
  const { toast } = useToast();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function atualizarTudo() {
    await refetch();
    if (carregandoAgenda) return;
    try {
      await sincronizarAgendasMotoristas(agendamentos);
    } catch (e) {
      console.error('Agenda dos motoristas:', e);
    }
  }

  async function handleAdicionar() {
    if (nome.trim().length < 2) {
      toast({ title: 'Informe o nome do motorista', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await criarMotorista(nome, telefone);
      setNome('');
      setTelefone('');
      await atualizarTudo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <FinanceiroLayout titulo="Motoristas" voltar>
      <div className="flex flex-col gap-4">

        <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-700">Cadastrar motorista</p>
          <input type="text" placeholder="Nome" value={nome}
            onChange={e => setNome(e.target.value)} className={inputCls} />
          <input type="tel" placeholder="WhatsApp — Ex: (54) 99999-9999" value={telefone}
            onChange={e => setTelefone(e.target.value)} className={inputCls} />
          <button onClick={handleAdicionar} disabled={salvando}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            <UserPlus size={18} /> {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>

        <p className="text-xs text-slate-500 px-1">
          Cada motorista tem um link próprio com os serviços que você passou para ele, de hoje em diante e sem valores.
          A agenda dele é atualizada sempre que você abre a sua Agenda.
        </p>

        {isLoading && <p className="text-center text-sm text-slate-400 py-6">Carregando...</p>}

        {!isLoading && motoristas.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-sm text-slate-500">
            Nenhum motorista cadastrado. Serviços sem motorista ficam com você.
          </div>
        )}

        {motoristas.map(m => (
          <CardMotorista key={m.id} motorista={m} onAlterado={atualizarTudo} />
        ))}
      </div>
    </FinanceiroLayout>
  );
}

function CardMotorista({ motorista: m, onAlterado }: { motorista: Motorista; onAlterado: () => Promise<void> }) {
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState<'excluir' | 'link' | null>(null);
  const [nome, setNome] = useState(m.nome);
  const [telefone, setTelefone] = useState(m.telefone ?? '');
  const link = linkAgendaMotorista(m.token);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link copiado!' });
    } catch {
      toast({ title: 'Não foi possível copiar', description: link });
    }
  }

  function enviar() {
    const msg = `Olá, ${m.nome.split(' ')[0]}! 👋\n\nEste é o link da sua agenda de serviços comigo. Ele mostra sempre os próximos serviços atualizados:\n\n${link}`;
    window.open(linkWhatsApp(m.telefone, msg), '_blank');
  }

  async function salvarEdicao() {
    if (nome.trim().length < 2) return;
    await atualizarMotorista(m.id!, nome, telefone);
    setEditando(false);
    await onAlterado();
  }

  async function confirmar() {
    if (confirmando === 'excluir') await excluirMotorista(m);
    if (confirmando === 'link') {
      await gerarNovoLink(m);
      toast({ title: 'Novo link gerado', description: 'O link antigo parou de funcionar. Envie o novo ao motorista.' });
    }
    setConfirmando(null);
    await onAlterado();
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      {editando ? (
        <div className="flex flex-col gap-2">
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={inputCls} />
          <input type="tel" value={telefone} placeholder="WhatsApp" onChange={e => setTelefone(e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <button onClick={salvarEdicao} className="flex-1 bg-blue-700 text-white text-sm py-2 rounded-xl flex items-center justify-center gap-1">
              <Check size={15} /> Salvar
            </button>
            <button onClick={() => { setEditando(false); setNome(m.nome); setTelefone(m.telefone ?? ''); }}
              className="flex-1 bg-slate-100 text-slate-600 text-sm py-2 rounded-xl flex items-center justify-center gap-1">
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="font-medium text-slate-800">{m.nome}</p>
          <p className="text-xs text-slate-400">{m.telefone || 'Sem WhatsApp cadastrado'}</p>
        </div>
      )}

      {confirmando ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-600">
            {confirmando === 'excluir'
              ? `Excluir ${m.nome}? Os serviços dele voltam para você e o link para de funcionar.`
              : 'Gerar um link novo? O link atual para de funcionar.'}
          </p>
          <div className="flex gap-2">
            <button onClick={confirmar}
              className={`flex-1 text-white text-xs py-2 rounded-xl font-medium ${confirmando === 'excluir' ? 'bg-red-600' : 'bg-amber-600'}`}>
              Confirmar
            </button>
            <button onClick={() => setConfirmando(null)}
              className="flex-1 bg-slate-100 text-slate-700 text-xs py-2 rounded-xl font-medium">
              Cancelar
            </button>
          </div>
        </div>
      ) : !editando && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <button onClick={enviar} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 py-1">
            <Send size={14} /> Enviar link
          </button>
          <button onClick={copiar} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 py-1">
            <Copy size={14} /> Copiar link
          </button>
          <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-1">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={() => setConfirmando('link')} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 py-1">
            <RefreshCw size={14} /> Novo link
          </button>
          <button onClick={() => setConfirmando('excluir')} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 py-1">
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}
