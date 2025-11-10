import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Inițializare Firebase Admin (doar server-side)
let app;
if (getApps().length === 0) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      app = initializeApp({ credential: cert(serviceAccount) });
      console.log('✅ Firebase Admin initialized with service account file');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Parse și corectează private_key (înlocuiește \\n cu \n)
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const serviceAccountRaw = JSON.parse(rawKey);
      
      // Fix private_key: înlocuiește \\n cu newline real
      if (serviceAccountRaw.private_key) {
        serviceAccountRaw.private_key = serviceAccountRaw.private_key.replace(/\\n/g, '\n');
      }
      
      app = initializeApp({ credential: cert(serviceAccountRaw) });
      console.log('✅ Firebase Admin initialized with JSON env var');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
      console.log('✅ Firebase Admin initialized with individual env vars');
    } else {
      throw new Error('Firebase credentials not found!');
    }
  } catch (error) {
    console.error('❌ Firebase Admin error:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export default app;
