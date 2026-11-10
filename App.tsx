import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { RouterProvider, createHashRouter, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import PWAUpdateManager from './components/PWAUpdateManager';
import NotFound from './components/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import DiaryLayout from './DiaryLayout';
import { CryptoProvider } from './contexts/CryptoContext';
import { ToastProvider } from './contexts/ToastContext';
import { Session } from '@supabase/supabase-js';
import { NativeBackButtonHandler } from './lib/native/useAndroidBackButton';
import { Outlet } from 'react-router-dom';
import { TaskProvider } from './contexts/TaskContext';

// Dynamic route code splitting to reduce initial bundle from ~2MB to lightweight chunks
const Timeline = React.lazy(() => import('./routes/Timeline'));
const Calendar = React.lazy(() => import('./routes/Calendar'));
const Search = React.lazy(() => import('./routes/Search'));
const Profile = React.lazy(() => import('./routes/Profile'));
const EntryDetail = React.lazy(() => import('./routes/EntryDetail'));
const Editor = React.lazy(() => import('./routes/Editor'));
const MyStuffHome = React.lazy(() => import('./routes/MyStuff/MyStuffHome'));
const MyStuffImages = React.lazy(() => import('./routes/MyStuff/MyStuffImages'));
const MyStuffAudio = React.lazy(() => import('./routes/MyStuff/MyStuffAudio'));
const TasksHub = React.lazy(() => import('./routes/Tasks/TasksHub'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const Auth = React.lazy(() => import('./components/Auth'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
const TermsOfUse = React.lazy(() => import('./components/TermsOfUse'));
const DeleteAccountWeb = React.lazy(() => import('./routes/DeleteAccountWeb'));

const RouteLoadingSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 animate-pulse text-slate-400">
    <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
    <div className="h-2 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<RouteLoadingSkeleton />}>
    <Component />
  </Suspense>
);

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

const RootLayout: React.FC = () => {
  return (
    <>
      <NativeBackButtonHandler />
      <Outlet />
    </>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Handle session initialization with error handling to prevent infinite loading
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        // Ensure we safely access session, defaulting to null if data is missing
        setSession(data?.session ?? null);
      } catch (err) {
        console.error("Unexpected error during auth initialization:", err);
        // Ensure session is null on error so the app can load in unauthenticated state
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

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

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const router = useMemo(() => {
     return createHashRouter([
       {
           element: <RootLayout />,
           errorElement: <ErrorBoundary />,
           children: [
        {
            path: "/",
            element: session ? <Navigate to="/app" /> : withSuspense(LandingPage),
        },
        {
            path: "/login",
            element: session ? <Navigate to="/app" /> : withSuspense(Auth),
        },
        {
            path: "/privacy",
            element: withSuspense(PrivacyPolicy),
        },
        {
            path: "/terms",
            element: withSuspense(TermsOfUse),
        },
        {
            path: "/delete-account",
            element: withSuspense(DeleteAccountWeb),
        },
        {
            path: "/app",
            element: (
                <ProtectedRoute session={session}>
                    <TaskProvider userId={session?.user?.id}>
                        <DiaryLayout session={session} theme={theme} onToggleTheme={toggleTheme} />
                    </TaskProvider>
                </ProtectedRoute>
            ),
            errorElement: <ErrorBoundary />,
            children: [
                { index: true, element: withSuspense(Timeline) },
                { path: "tasks", element: withSuspense(TasksHub) },
                { path: "calendar", element: withSuspense(Calendar) },
                { path: "search", element: withSuspense(Search) },
                { path: "profile", element: withSuspense(Profile) },
                { path: "mystuff", element: withSuspense(MyStuffHome) },
                { path: "mystuff/images", element: withSuspense(MyStuffImages) },
                { path: "mystuff/audio", element: withSuspense(MyStuffAudio) },
                { path: "entry/:id", element: withSuspense(EntryDetail) },
                { path: "new", element: withSuspense(Editor) },
                { path: "edit/:id", element: withSuspense(Editor) },
            ],
        },
        {
            path: "*",
            element: <NotFound />,
        }
           ]
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
        <PWAUpdateManager />
        <RouterProvider router={router} />
      </CryptoProvider>
    </ToastProvider>
  );
};

export default App;
