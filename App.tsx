import React, { useState, useEffect, useMemo } from 'react';
import { RouterProvider, createHashRouter, Navigate, useLocation } from 'react-router-dom';
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

// Route Components
import Timeline from './routes/Timeline';
import Calendar from './routes/Calendar';
import Search from './routes/Search';
import Profile from './routes/Profile';
import EntryDetail from './routes/EntryDetail';
import Editor from './routes/Editor';

const ProtectedRoute = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
  // We can't use useLocation here if this component is rendered *outside* the provider context
  // BUT, since this component is used inside 'element' of the router, it IS inside the context.
  // However, createHashRouter defines the tree.
  // actually, components rendered by RouterProvider have access to hooks.
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

  const router = useMemo(() => {
     return createHashRouter([
        {
            path: "/",
            element: session ? <Navigate to="/app" /> : <LandingPage />,
        },
        {
            path: "/login",
            element: session ? <Navigate to="/app" /> : <Auth />,
        },
        {
            path: "/privacy",
            element: <PrivacyPolicy />,
        },
        {
            path: "/terms",
            element: <TermsOfUse />,
        },
        {
            path: "/app",
            element: (
                <ProtectedRoute session={session}>
                    <DiaryLayout session={session} theme={theme} onToggleTheme={toggleTheme} />
                </ProtectedRoute>
            ),
            children: [
                { index: true, element: <Timeline /> },
                { path: "calendar", element: <Calendar /> },
                { path: "search", element: <Search /> },
                { path: "profile", element: <Profile /> },
                { path: "entry/:id", element: <EntryDetail /> },
                { path: "new", element: <Editor /> },
                { path: "edit/:id", element: <Editor /> },
            ],
        },
        {
            path: "*",
            element: <NotFound />,
        }
     ]);
  }, [session, theme]); // Dependencies ensure router updates if these change

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
        <RouterProvider router={router} />
      </CryptoProvider>
    </ToastProvider>
  );
};

export default App;
