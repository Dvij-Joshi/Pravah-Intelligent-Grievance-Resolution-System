import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch session + role in ONE parallel round — no sequential waiting
  const initAuth = async (supabaseSession) => {
    setSession(supabaseSession);
    const currentUser = supabaseSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      setRole(data?.role ?? 'citizen');
    } else {
      setRole(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      initAuth(session);
    });

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initAuth(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    isOfficer: role === 'officer',
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signUp: (data) => supabase.auth.signUp(data),
    signOut: () => supabase.auth.signOut(),
  };

  // Always render children — let ProtectedRoute handle the loading state display.
  // Never block the whole app tree with a loading gate here.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
