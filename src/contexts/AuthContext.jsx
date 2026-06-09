import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    insforge.auth.getUser().then(({ data: { user } }) => {
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
      try {
        const res = await insforge.auth.signInWithPassword(credentials);
        if (res.error) throw res.error;
        if (res.data?.session?.user) {
          setUser(res.data.session.user);
        }
        return res;
      } catch (err) {
        throw err;
      }
    },
    signUp: async (credentials) => {
      try {
        const res = await insforge.auth.signUp(credentials);
        if (res.error) throw res.error;
        return res;
      } catch (err) {
        throw err;
      }
    },
    signOut: async () => {
      localStorage.removeItem('mock_user');
      try {
        await insforge.auth.signOut();
      } catch (e) {
        // Ignore error
      }
      setUser(null);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

