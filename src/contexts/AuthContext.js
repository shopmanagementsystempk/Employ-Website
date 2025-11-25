import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from '../utils/toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // 1) Try to get role from custom claims
        const idTokenResult = await user.getIdTokenResult();
        let role = idTokenResult.claims.role || null;

        // 2) Also fetch user document for additional info / fallback role
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // If no custom-claim role, fall back to Firestore role (e.g. 'employee')
            if (!role && userData.role) {
              role = userData.role;
            }

            if (userData.blocked) {
              await signOut(auth);
              toast.error('Your account has been blocked. Please contact administrator.');
            }
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
        }

        setUserRole(role || null);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      toast.success('Registration successful!');
      return userCredential.user;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const refreshUserRole = async () => {
    if (currentUser) {
      await currentUser.getIdToken(true); // Force token refresh
      const idTokenResult = await currentUser.getIdTokenResult();
      const role = idTokenResult.claims.role || null;
      setUserRole(role);
    }
  };

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    resetPassword,
    refreshUserRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

