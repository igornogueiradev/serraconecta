import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  getDocs, query, where, writeBatch,
} from 'firebase/firestore';
import { db, auth } from './client';
import type { Receita, Gasto, Agendamento } from './types';

function uid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  return user.uid;
}

function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)])
    ) as T;
  }
  return value;
}

// ── RECEITAS ─────────────────────────────────────────────────────────────────

export async function salvarReceita(
  dados: Omit<Receita, 'id' | 'user_id' | 'created_at'>
): Promise<string> {
  const user_id = uid();
  const batch = writeBatch(db);

  const receitaRef = doc(collection(db, 'receitas'));
  batch.set(receitaRef, clean({ ...dados, user_id, created_at: new Date().toISOString() } as Record<string, unknown>));

  if (dados.pedagioParticular && dados.pedagioParticular > 0) {
    const gastoRef = doc(collection(db, 'gastos'));
    batch.set(gastoRef, {
      user_id,
      categoria: 'pedagio',
      descricao: 'Pedágio (particular)',
      valor: dados.pedagioParticular,
      data: dados.data,
      receitaId: receitaRef.id,
      created_at: new Date().toISOString(),
    });
  }

  await batch.commit();
  return receitaRef.id;
}

export async function atualizarReceita(id: string, dados: Partial<Omit<Receita, 'id' | 'user_id'>>): Promise<void> {
  await updateDoc(doc(db, 'receitas', id), clean(dados as Record<string, unknown>));
}

export async function deletarReceita(id: string): Promise<void> {
  const user_id = uid();
  const batch = writeBatch(db);

  batch.delete(doc(db, 'receitas', id));

  const gastosSnap = await getDocs(
    query(collection(db, 'gastos'), where('user_id', '==', user_id), where('receitaId', '==', id))
  );
  gastosSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();
}

export async function buscarReceitaPorId(id: string): Promise<Receita | null> {
  const snap = await getDoc(doc(db, 'receitas', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Receita;
}

// ── GASTOS ───────────────────────────────────────────────────────────────────

export async function salvarGasto(
  dados: Omit<Gasto, 'id' | 'user_id' | 'created_at'>
): Promise<string> {
  const user_id = uid();
  const ref = await addDoc(collection(db, 'gastos'), clean({
    ...dados,
    user_id,
    created_at: new Date().toISOString(),
  } as Record<string, unknown>));
  return ref.id;
}

export async function atualizarGasto(id: string, dados: Partial<Omit<Gasto, 'id' | 'user_id'>>): Promise<void> {
  await updateDoc(doc(db, 'gastos', id), clean(dados as Record<string, unknown>));
}

export async function deletarGasto(id: string): Promise<void> {
  await deleteDoc(doc(db, 'gastos', id));
}

export async function buscarGastoPorId(id: string): Promise<Gasto | null> {
  const snap = await getDoc(doc(db, 'gastos', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Gasto;
}

// ── AGENDAMENTOS ─────────────────────────────────────────────────────────────

export async function salvarAgendamento(
  dados: Omit<Agendamento, 'id' | 'user_id' | 'created_at'>
): Promise<string> {
  const user_id = uid();
  const ref = await addDoc(collection(db, 'agendamentos'), clean({
    ...dados,
    user_id,
    created_at: new Date().toISOString(),
  } as Record<string, unknown>));
  return ref.id;
}

export async function atualizarAgendamento(id: string, dados: Partial<Omit<Agendamento, 'id' | 'user_id'>>): Promise<void> {
  await updateDoc(doc(db, 'agendamentos', id), clean(dados as Record<string, unknown>));
}

export async function deletarAgendamento(id: string): Promise<void> {
  await deleteDoc(doc(db, 'agendamentos', id));
}

export async function buscarAgendamentoPorId(id: string): Promise<Agendamento | null> {
  const snap = await getDoc(doc(db, 'agendamentos', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Agendamento;
}
