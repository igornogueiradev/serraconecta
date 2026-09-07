import { db } from './client';
import {
  collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc,
} from 'firebase/firestore';
import type { QuestionarioResposta } from './types';

export async function getAgendamentoParaQuestionario(id: string) {
  const snap = await getDoc(doc(db, 'agendamentos', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getRespostaPorAgendamento(agendamentoId: string): Promise<QuestionarioResposta | null> {
  const q = query(
    collection(db, 'questionario_respostas'),
    where('agendamento_id', '==', agendamentoId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as QuestionarioResposta;
}

export async function salvarResposta(
  agendamentoId: string,
  dados: Omit<QuestionarioResposta, 'id' | 'created_at' | 'updated_at'>,
): Promise<void> {
  const existente = await getRespostaPorAgendamento(agendamentoId);
  const now = new Date().toISOString();

  if (existente?.id) {
    await updateDoc(doc(db, 'questionario_respostas', existente.id), {
      ...dados,
      updated_at: now,
    });
  } else {
    await addDoc(collection(db, 'questionario_respostas'), {
      ...dados,
      created_at: now,
      updated_at: now,
    });
  }

  await updateDoc(doc(db, 'agendamentos', agendamentoId), {
    questionario_respondido: true,
    questionario_edicao_habilitada: false,
  });
}
