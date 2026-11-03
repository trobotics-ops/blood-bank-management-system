import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { apiPost } from './api';

export async function loginUser(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result;
}

export async function registerUser(email, password, userData) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (userData?.displayName) {
    await updateProfile(result.user, { displayName: userData.displayName });
  }

  await apiPost('/api/auth/register', {
    email,
    displayName: userData?.displayName || '',
    role: userData?.role || 'donor',
    phone: userData?.phone || '',
    organizationName: userData?.organization || '',
  });

  return result;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);

  try {
    await apiPost('/api/users/register', {
      email: result.user.email,
      displayName: result.user.displayName || '',
      role: 'donor',
    });
  } catch {
    // User may already exist, ignore
  }

  return result;
}

export async function logoutUser() {
  return signOut(auth);
}
