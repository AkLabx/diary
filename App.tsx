import React, { useState, useEffect } from 'react';
// Fix: Use 'import type' for Session to resolve potential module resolution issues with older Supabase versions.
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import DiaryApp from './DiaryApp';
import { CryptoProvider } from './contexts/CryptoContext';
import { ToastProvider } from './contexts/ToastContext';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // This is the v2 way to get the session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // This is the v2 listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <CryptoProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
          {!session ? <Auth /> : <DiaryApp key={session.user.id} session={session} theme={theme} onToggleTheme={toggleTheme} />}
        </div>
      </CryptoProvider>
    </ToastProvider>
  );
};

export default App;