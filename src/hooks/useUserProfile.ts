import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/integrations/firebase/client';
import type { UserProfile } from '@/integrations/firebase/types';

export function useUserProfile() {
  const [profile, setProfile] = useState<(UserProfile & { user_id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setProfile({ ...(snap.data() as UserProfile), user_id: user.uid });
      setLoading(false);
    });
  }, []);

  async function updateProfile(data: Partial<Pick<UserProfile, 'phone' | 'agency_name' | 'logo_url'>>) {
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), data);
    setProfile(prev => prev ? { ...prev, ...data } : prev);
  }

  async function uploadLogo(file: File): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');
    const ext = file.name.split('.').pop() || 'jpg';
    const fileRef = ref(storage, `logos/${user.uid}/logo.${ext}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  return { profile, loading, updateProfile, uploadLogo };
}
