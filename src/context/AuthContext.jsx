import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile role for a user ID
  async function fetchRole(userId) {
    if (!userId) return null;
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role ?? 'citizen';
  }

  useEffect(() => {
    let mounted = true;

    // ── Step 1: Bootstrap from stored session ──────────────────────────────
    async function bootstrap() {
      const { data: { session: storedSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (storedSession?.user) {
        const r = await fetchRole(storedSession.user.id);
        if (!mounted) return;
        setSession(storedSession);
        setUser(storedSession.user);
        setRole(r);
      }
      setLoading(false);
    }

    bootstrap();

    // ── Step 2: React to auth events (login / logout / token refresh) ──────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          newSession?.user
        ) {
          const r = await fetchRole(newSession.user.id);
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession.user);
          setRole(r);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    isOfficer: role === 'officer',
    signIn:  (data) => supabase.auth.signInWithPassword(data),
    signUp:  (data) => supabase.auth.signUp(data),
    signOut: ()     => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
