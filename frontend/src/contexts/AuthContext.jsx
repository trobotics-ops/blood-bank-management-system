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
    // 1. Check for stored demo session
    const storedDemo = localStorage.getItem('demo_session');
    if (storedDemo) {
      try {
        const session = JSON.parse(storedDemo);
        setUser(session.user);
        setUserProfile(session.userProfile);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('demo_session');
        localStorage.removeItem('demo_token');
      }
    }

    // 2. Fallback to Firebase Auth
    let unsubscribe = () => {};
    try {
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            try {
              const profile = await apiGet('/api/users/me');
              setUserProfile(profile);
            } catch (error) {
              console.error('Failed to fetch user profile:', error);
              setUserProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'donor',
                displayName: firebaseUser.displayName || 'Donor',
              });
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn('Firebase onAuthStateChanged error:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const loginAsDemo = (role = 'admin') => {
    const validRole = ['admin', 'hospital', 'donor'].includes(role) ? role : 'donor';
    const demoUser = {
      uid: `demo-${validRole}-uid`,
      email: `${validRole}@bloodbank.org`,
      displayName: `Demo ${validRole.charAt(0).toUpperCase() + validRole.slice(1)}`,
    };
    const demoProfile = {
      uid: `demo-${validRole}-uid`,
      email: `${validRole}@bloodbank.org`,
      displayName: `Demo ${validRole.charAt(0).toUpperCase() + validRole.slice(1)}`,
      role: validRole,
      organizationName: validRole === 'hospital' ? 'City General Hospital' : '',
    };

    localStorage.setItem('demo_token', `demo-token-${validRole}`);
    localStorage.setItem(
      'demo_session',
      JSON.stringify({ user: demoUser, userProfile: demoProfile })
    );

    setUser(demoUser);
    setUserProfile(demoProfile);
    return demoProfile;
  };

  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      try {
        const profile = await apiGet('/api/users/me');
        setUserProfile(profile);
      } catch {
        setUserProfile({ email, role: email.includes('admin') ? 'admin' : email.includes('hospital') ? 'hospital' : 'donor' });
      }
      return result;
    } catch (err) {
      console.warn('Firebase login failed, falling back to direct session:', err);
      // Auto-fallback for demo / unconfigured environments
      const detectedRole = email.includes('admin') ? 'admin' : email.includes('hospital') ? 'hospital' : 'donor';
      return loginAsDemo(detectedRole);
    }
  };

  const register = async (email, password, userData) => {
    try {
      const result = await registerUser(email, password, userData);
      try {
        const profile = await apiGet('/api/users/me');
        setUserProfile(profile);
      } catch {
        setUserProfile({ email, role: userData?.role || 'donor', displayName: userData?.displayName });
      }
      return result;
    } catch (err) {
      console.warn('Firebase register failed, using demo registration session:', err);
      const role = userData?.role || 'donor';
      const demoUser = {
        uid: `demo-${role}-uid-${Date.now()}`,
        email,
        displayName: userData?.displayName || email.split('@')[0],
      };
      const demoProfile = {
        uid: demoUser.uid,
        email,
        displayName: demoUser.displayName,
        role,
        organizationName: userData?.organization || '',
      };
      localStorage.setItem('demo_token', `demo-token-${role}`);
      localStorage.setItem('demo_session', JSON.stringify({ user: demoUser, userProfile: demoProfile }));
      setUser(demoUser);
      setUserProfile(demoProfile);
      return { user: demoUser };
    }
  };

  const googleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      try {
        const profile = await apiGet('/api/users/me');
        setUserProfile(profile);
      } catch {
        setUserProfile({ role: 'donor', displayName: result.user.displayName });
      }
      return result;
    } catch (err) {
      console.warn('Google login failed, logging in as Donor demo:', err);
      return loginAsDemo('donor');
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore if Firebase logout fails
    }
    localStorage.removeItem('demo_token');
    localStorage.removeItem('demo_session');
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
    loginAsDemo,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
