import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/integrations/firebase/client';

export function useMetaMensal() {
  const [meta, setMeta] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setIsLoading(false); return; }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      setMeta(snap.data()?.meta_mensal ?? 0);
      setIsLoading(false);
    });
  }, []);

  const salvarMeta = async (valor: number) => {
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { meta_mensal: valor });
    setMeta(valor);
  };

  return { meta, isLoading, salvarMeta };
}
