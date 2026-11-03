import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { loginUser, registerUser, loginWithGoogle, logoutUser } from '../services/authService';
import { apiGet } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await apiGet('/api/users/me');
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    const profile = await apiGet('/api/users/me');
    setUserProfile(profile);
    return result;
  };

  const register = async (email, password, userData) => {
    const result = await registerUser(email, password, userData);
    const profile = await apiGet('/api/users/me');
    setUserProfile(profile);
    return result;
  };

  const googleLogin = async () => {
    const result = await loginWithGoogle();
    try {
      const profile = await apiGet('/api/users/me');
      setUserProfile(profile);
    } catch {
      setUserProfile({ role: 'donor', displayName: result.user.displayName });
    }
    return result;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle: googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
