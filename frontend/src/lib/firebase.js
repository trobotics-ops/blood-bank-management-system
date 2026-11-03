import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyBloodBankApp2026ValidFormatX',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'project-ad83f799-f8d2-4553-9e0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'project-ad83f799-f8d2-4553-9e0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'project-ad83f799-f8d2-4553-9e0.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '230626734607',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:230626734607:web:73ac56b46bb746ff9dba',
};

let app;
let auth;
let googleProvider;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.warn('Firebase init fallback active:', err);
  auth = {
    currentUser: null,
    onAuthStateChanged: (cb) => {
      cb(null);
      return () => {};
    },
  };
  googleProvider = {};
}

export { auth, googleProvider };
export default app;
