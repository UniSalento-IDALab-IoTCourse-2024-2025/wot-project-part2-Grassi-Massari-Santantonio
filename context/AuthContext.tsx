// context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';
//import { supabase } from './supabase';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  signIn: (ip: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setLoading] = useState(true);

useEffect(() => {
    (async () => {
      const ip = await AsyncStorage.getItem('ip');
      const token = await AsyncStorage.getItem('authToken');

      if (ip && token) {
        try {
          const resp = await fetch(`http://${ip}:3000/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (resp.ok) {
            const { user: me } = await resp.json();
            setUser(me);
          } else {
            // token scaduto o non valido: pulisci
            await AsyncStorage.clear();
            setUser(null);
          }
        } catch {
          // rete o server down
          await AsyncStorage.clear();
          setUser(null);
        }
      }

      setLoading(false);
    })();
  }, []);

  const signIn = async (ip: string, email: string, password: string) => {
    setLoading(true);
    try {
      const url = `http://${ip.trim()}:3000/login`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || 'Login fallito');

      // salva token e user
      const { session, user } = body;
      await AsyncStorage.setItem('ip', ip);
      await AsyncStorage.setItem('authToken', session.access_token);
      await AsyncStorage.setItem('refreshToken', session.refresh_token);
      await AsyncStorage.setItem('riderEmail', user.email);
      const emailLocal = user.email.split('@')[0];


      const riderName =
        emailLocal.charAt(0).toUpperCase() +
        emailLocal.slice(1).toLowerCase();


      await AsyncStorage.setItem('riderName', riderName);

      const idResp = await fetch(`http://${ip.trim()}:3000/rider-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // se il tuo endpoint richiede autenticazione:
        // Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email: user.email }),
    });
    const idBody = await idResp.json();
    if (!idResp.ok) throw new Error(idBody.error || 'Recupero ID fallito');

    const riderId = idBody.id;
    await AsyncStorage.setItem('riderId', riderId.toString());

      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    //await supabase.auth.signOut();
    await AsyncStorage.clear();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato in AuthProvider');
  return ctx;
};
