import React, { useState } from 'react';
import { supabase, supabaseUrl, supabaseKey } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import Monkey from './Monkey';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [focusState, setFocusState] = useState<'idle' | 'email' | 'password'>('idle');
  const [typingCounter, setTypingCounter] = useState(0);

  const handleFocusEmail = () => setFocusState('email');
  const handleFocusPassword = () => setFocusState('password');
  const handleBlurInputs = () => setFocusState('idle');

  const handleKeyDown = () => {
    setTypingCounter(c => c + 1);
  };

  const isConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-fade-in">
        <div className="w-full max-w-lg p-8 space-y-4 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Configuration Needed</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Welcome to Diary! To get started, you need to connect the app to your own Supabase project.
          </p>
          <div className="text-sm text-left text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
            <p className="font-semibold mb-2">Please follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to the file <code className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-1 rounded">lib/supabaseClient.ts</code> in your project.</li>
              <li>Replace the placeholder values for <code className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-1 rounded">supabaseUrl</code> and <code className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-1 rounded">supabaseKey</code> with the credentials from your Supabase project's API settings.</li>
              <li>Make sure you have run the SQL scripts in that file to create the `profiles` and `diaries` tables.</li>
              <li>Save the file. The app will automatically reload.</li>
            </ol>
          </div>
           <p className="text-xs text-slate-400 pt-2">
            If you don't have a Supabase project, you can create one for free at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 underline">supabase.com</a>.
          </p>
        </div>
      </div>
    );
  }
  
  const handleSignUp = async () => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      addToast('Check your email for the confirmation link!', 'success');
  }

  const handleSignIn = async () => {
      // v2 syntax for email/password sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
  }
  
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      // v2 syntax for OAuth sign in
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.error_description || error.message);
      setLoading(false); // Only set loading to false on error, on success it will redirect
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error: any)
      {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const emailProgress = Math.min(email.length / 30, 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <Monkey 
          focusState={focusState}
          emailProgress={emailProgress}
          typingCounter={typingCounter} 
        />
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Diary</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{isSignUp ? 'Create a secure, encrypted account.' : 'Sign in to access your journal.'}</p>
        </div>

        {error && <p className="text-center text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-300 p-3 rounded-md">{error}</p>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            required
            onChange={(e) => {
                setEmail(e.target.value);
                handleKeyDown();
            }}
            onFocus={handleFocusEmail}
            onBlur={handleBlurInputs}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Your password (min 6 characters)"
            value={password}
            required
            minLength={6}
            onChange={(e) => {
                setPassword(e.target.value)
                handleKeyDown();
            }}
            onFocus={handleFocusPassword}
            onBlur={handleBlurInputs}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
          <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 transition-colors">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
            </div>
        </div>
        
        <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 disabled:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 dark:disabled:bg-slate-700 transition-colors"
            aria-label="Sign in with Google"
        >
            <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.8 0-5.2-1.89-6.06-4.44H2.36v2.84C4.01 20.44 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.94 14.06c-.18-.54-.28-1.11-.28-1.69s.1-1.15.28-1.69V7.84H2.36C1.5 9.49 1 11.18 1 12.87s.5 3.38 1.36 4.96l3.58-2.77z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.33 14.97 0 12 0 7.7 0 4.01 2.56 2.36 6.21l3.58 2.84C6.8 4.73 9.2 2.84 12 5.38z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sign in with Google</span>
        </button>
        
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => {setIsSignUp(!isSignUp); setError(null)}} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
        </p>
        
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 pt-2">
            Note: For security, password reset is not supported. If you forget your password, your encrypted data will be unrecoverable.
        </p>

      </div>
    </div>
  );
};

export default Auth;