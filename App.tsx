import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import NotFound from './components/NotFound';
import DiaryLayout from './DiaryLayout';
import { CryptoProvider } from './contexts/CryptoContext';
import { ToastProvider } from './contexts/ToastContext';
import { Session } from '@supabase/supabase-js';

// Route Components (to be created in the next step, but importing them for structure)
import Timeline from './routes/Timeline';
import Calendar from './routes/Calendar';
import Search from './routes/Search';
import Profile from './routes/Profile';
import EntryDetail from './routes/EntryDetail';
import Editor from './routes/Editor';

const ProtectedRoute = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
        <BrowserRouter basename="/diary/">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={session ? <Navigate to="/app" /> : <LandingPage />} />
            <Route path="/login" element={session ? <Navigate to="/app" /> : <Auth />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />

            {/* Protected App Routes */}
            <Route path="/app" element={
              <ProtectedRoute session={session}>
                <DiaryLayout session={session} theme={theme} onToggleTheme={toggleTheme} />
              </ProtectedRoute>
            }>
               <Route index element={<Timeline />} />
               <Route path="calendar" element={<Calendar />} />
               <Route path="search" element={<Search />} />
               <Route path="profile" element={<Profile />} />
               <Route path="entry/:id" element={<EntryDetail />} />
               <Route path="new" element={<Editor />} />
               <Route path="edit/:id" element={<Editor />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CryptoProvider>
    </ToastProvider>
  );
};

export default App;