import { db, auth } from './client';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc, query, where, deleteField, writeBatch,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { getRespostaPorAgendamento } from './questionario';
import { LABEL_TIPO_AGENDAMENTO } from '@/utils/financeiro/formatters';
import { formatarPassageiros, formatarRota, formatarVoo, isTransfer } from '@/utils/financeiro/agendamento';
import type { Agendamento, AgendaMotorista, Motorista, QuestionarioResposta, ServicoMotorista } from './types';

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

function novoToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

export function linkAgendaMotorista(token: string) {
  return `${window.location.origin}/m/${token}`;
}

export async function listarMotoristas(): Promise<Motorista[]> {
  const snap = await getDocs(query(collection(db, 'motoristas'), where('user_id', '==', uid())));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Motorista)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function criarMotorista(nome: string, telefone: string) {
  await addDoc(collection(db, 'motoristas'), {
    user_id: uid(),
    nome: nome.trim(),
    ...(telefone.trim() ? { telefone: telefone.trim() } : {}),
    token: novoToken(),
    created_at: new Date().toISOString(),
  });
}

export async function atualizarMotorista(id: string, nome: string, telefone: string) {
  await updateDoc(doc(db, 'motoristas', id), {
    nome: nome.trim(),
    telefone: telefone.trim() || deleteField(),
  });
}

async function apagarAgendaPublica(token: string) {
  try {
    await deleteDoc(doc(db, 'agenda_motorista', token));
  } catch {
    // a agenda pública ainda não tinha sido gerada
  }
}

export async function gerarNovoLink(motorista: Motorista) {
  await apagarAgendaPublica(motorista.token);
  await updateDoc(doc(db, 'motoristas', motorista.id!), { token: novoToken() });
}

export async function excluirMotorista(motorista: Motorista) {
  const userId = uid();
  const batch = writeBatch(db);
  for (const campo of ['motorista_id', 'motorista_volta_id']) {
    const snap = await getDocs(query(
      collection(db, 'agendamentos'),
      where('user_id', '==', userId),
      where(campo, '==', motorista.id),
    ));
    snap.docs.forEach(d => batch.update(d.ref, { [campo]: deleteField() }));
  }
  batch.delete(doc(db, 'motoristas', motorista.id!));
  await batch.commit();
  await apagarAgendaPublica(motorista.token);
}

export async function getAgendaMotorista(token: string): Promise<AgendaMotorista | null> {
  const snap = await getDoc(doc(db, 'agenda_motorista', token));
  return snap.exists() ? (snap.data() as AgendaMotorista) : null;
}

interface Trecho {
  agendamento: Agendamento;
  leg?: 'ida' | 'volta';
  motoristaId?: string;
  data: string;
  hora: string;
}

function semVazios<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as T;
}

function servicoParaMotorista(t: Trecho, r: QuestionarioResposta | null | undefined): ServicoMotorista {
  const a = t.agendamento;
  const volta = t.leg === 'volta';
  const vooAgendamento = volta ? a.voo_volta : a.voo_ida;
  const numeroVooCliente = r ? (a.ida_e_volta ? (volta ? r.num_voo_volta : r.num_voo_ida) : r.num_voo) : undefined;
  const voo = formatarVoo({ ...vooAgendamento, numero: numeroVooCliente || vooAgendamento?.numero });

  const bagagens = r ? [
    (r.bagagens_23kg ?? 0) > 0 ? `${r.bagagens_23kg}×23kg` : '',
    (r.bagagens_10kg ?? 0) > 0 ? `${r.bagagens_10kg}×10kg` : '',
    (r.bolsas ?? 0) > 0 ? `${r.bolsas} bolsa(s)` : '',
  ].filter(Boolean).join(' | ') : '';

  const equipamentos = r ? [
    (r.cadeirinha ?? 0) > 0 ? `${r.cadeirinha} cadeirinha(s)` : '',
    (r.elevacao ?? 0) > 0 ? `${r.elevacao} assento(s) de elevação` : '',
    r.item_volumoso ? `Item volumoso: ${r.item_volumoso_desc || 'sim'}` : '',
    r.mobilidade_reduzida ? `Mobilidade reduzida: ${r.mobilidade_reduzida_desc || 'sim'}` : '',
  ].filter(Boolean).join(' · ') : '';

  const trecho = t.leg === 'ida' ? 'IN' : volta ? 'OUT'
    : a.direcao === 'in' ? 'IN' : a.direcao === 'out' ? 'OUT' : undefined;

  return semVazios({
    data: t.data,
    hora: t.hora,
    hora_fim: a.hora_fim,
    tipo: LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo,
    trecho,
    rota: formatarRota(volta ? a.destino_volta : a.destino),
    embarque: r?.ponto_embarque || (!isTransfer(a.tipo) ? a.origem : undefined),
    hotel: r?.hotel,
    cliente_nome: r?.nome || a.clienteNome,
    cliente_telefone: r?.telefone || a.clienteTelefone,
    passageiros: r ? formatarPassageiros(r.adultos, r.criancas) : formatarPassageiros(a.adultos, a.criancas),
    voo,
    bagagens,
    equipamentos,
    observacao: a.observacao,
    observacao_cliente: [r?.roteiro ? `Roteiro: ${r.roteiro}` : '', r?.observacoes ?? ''].filter(Boolean).join(' · '),
  });
}

export async function sincronizarAgendasMotoristas(agendamentos: Agendamento[]) {
  const motoristas = await listarMotoristas();
  if (!motoristas.length) return;

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const trechos: Trecho[] = [];
  for (const a of agendamentos) {
    if (a.status !== 'agendado' && a.status !== 'confirmado') continue;
    if (a.ida_e_volta) {
      trechos.push({ agendamento: a, leg: 'ida', motoristaId: a.motorista_id, data: a.data, hora: a.hora });
      if (a.data_volta) {
        trechos.push({ agendamento: a, leg: 'volta', motoristaId: a.motorista_volta_id, data: a.data_volta, hora: a.hora_volta ?? '' });
      }
    } else {
      trechos.push({ agendamento: a, motoristaId: a.motorista_id, data: a.data, hora: a.hora });
    }
  }

  const ids = new Set(motoristas.map(m => m.id));
  const relevantes = trechos.filter(t => t.motoristaId && ids.has(t.motoristaId) && t.data >= hoje);

  const respostas = new Map<string, QuestionarioResposta | null>();
  const respondidos = [...new Set(relevantes.filter(t => t.agendamento.questionario_respondido).map(t => t.agendamento.id!))];
  await Promise.all(respondidos.map(async id => respostas.set(id, await getRespostaPorAgendamento(id))));

  const userId = uid();
  const agora = new Date().toISOString();
  await Promise.all(motoristas.map(m => {
    const servicos = relevantes
      .filter(t => t.motoristaId === m.id)
      .sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora))
      .map(t => servicoParaMotorista(t, respostas.get(t.agendamento.id!)));
    const agenda: AgendaMotorista = { user_id: userId, motorista_nome: m.nome, atualizado_em: agora, servicos };
    return setDoc(doc(db, 'agenda_motorista', m.token), agenda);
  }));
}
