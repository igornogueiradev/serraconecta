import { db, auth } from './client';
import {
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc,
} from 'firebase/firestore';
import type { QuestionarioResposta } from './types';

export async function getAgendamentoParaQuestionario(id: string) {
  const snap = await getDoc(doc(db, 'agendamentos', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getRespostaPorAgendamento(agendamentoId: string): Promise<QuestionarioResposta | null> {
  const snap = await getDoc(doc(db, 'questionario_respostas', agendamentoId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as QuestionarioResposta;

  // Respostas antigas foram gravadas com ID aleatório; só o dono logado consegue consultá-las.
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const antigas = await getDocs(query(
    collection(db, 'questionario_respostas'),
    where('agendamento_id', '==', agendamentoId),
    where('owner_id', '==', uid),
  ));
  if (antigas.empty) return null;
  const d = antigas.docs[0];
  return { id: d.id, ...d.data() } as QuestionarioResposta;
}

export async function salvarResposta(
  agendamentoId: string,
  dados: Omit<QuestionarioResposta, 'id' | 'created_at' | 'updated_at'>,
): Promise<void> {
  const ref = doc(db, 'questionario_respostas', agendamentoId);
  const existente = await getDoc(ref);
  const now = new Date().toISOString();

  await setDoc(ref, {
    ...dados,
    ...(existente.exists() ? {} : { created_at: now }),
    updated_at: now,
  }, { merge: true });

  await updateDoc(doc(db, 'agendamentos', agendamentoId), {
    questionario_respondido: true,
    questionario_edicao_habilitada: false,
  });
}
