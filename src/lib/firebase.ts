// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser, 
  getIdToken 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_AUTH_DOMAIN'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
  console.error('Please check your .env.local file and ensure all Firebase configuration variables are set.');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log configuration in development
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('Firebase config loaded:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '[REDACTED]' : 'MISSING'
  });
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function getIdTokenString(user?: FirebaseUser) {
  if (!user) return null;
  return await getIdToken(user, /* forceRefresh */ false);
}

export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);
export const signOutFirebase = () => signOut(auth);

