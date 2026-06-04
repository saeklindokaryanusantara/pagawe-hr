import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  const value = {
    user,
    signInWithPassword: async (credentials) => {
      const res = await insforge.auth.signInWithPassword(credentials);
      if (res.data?.session?.user) {
        setUser(res.data.session.user);
      }
      return res;
    },
    signUp: async (credentials) => {
      return insforge.auth.signUp(credentials);
    },
    signOut: async () => {
      await insforge.auth.signOut();
      setUser(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
