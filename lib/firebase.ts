import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCd3rxFDvSYJ8jlVc7ZlyYs2liDt8nKT1o",
  authDomain: "iempathy-ffc85.firebaseapp.com",
  projectId: "iempathy-ffc85",
  storageBucket: "iempathy-ffc85.firebasestorage.app",
  messagingSenderId: "252693456701",
  appId: "1:252693456701:web:43d7fd9baf4e7abfa84754"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
