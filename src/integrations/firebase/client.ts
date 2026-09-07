import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBZdRAPi_Ymypy5q0KyO31RupaETBAYelI",
  authDomain: "serraconecta-1737c.firebaseapp.com",
  projectId: "serraconecta-1737c",
  storageBucket: "serraconecta-1737c.firebasestorage.app",
  messagingSenderId: "445371945348",
  appId: "1:445371945348:web:6d564120d5fdda3163cdd1",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
