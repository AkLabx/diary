import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import DiaryApp from './DiaryApp';
import LandingPage from './components/LandingPage';
import { CryptoProvider } from './contexts/CryptoContext';
import { ToastProvider } from './contexts/ToastContext';

type Session = any;

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // This is the v2 way to get the session
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    // This is the v2 listener
    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
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

  // Register the service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Important: The SW must be registered at the scope of the GitHub Pages repo subpath
        navigator.serviceWorker.register('/diary/sw.js', { scope: '/diary/' }).then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

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
        <div className="min-h-screen bg-[#FBF8F3] dark:bg-slate-900 font-sans">
          {!session ? (
            showLanding ? (
              <LandingPage onGetStarted={() => setShowLanding(false)} />
            ) : (
              <Auth onBackToHome={() => setShowLanding(true)} />
            )
          ) : (
            <DiaryApp key={session.user.id} session={session} theme={theme} onToggleTheme={toggleTheme} />
          )}
        </div>
      </CryptoProvider>
    </ToastProvider>
  );
};

export default App;