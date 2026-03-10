import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseKey } from '../lib/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import Monkey from './Monkey';

interface AuthProps {
  onBackToHome?: () => void;
}

const Auth: React.FC<AuthProps> = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const [focusState, setFocusState] = useState<'idle' | 'email' | 'password'>('idle');
  const [typingCounter, setTypingCounter] = useState(0);
  
  // New state for password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocusEmail = () => setFocusState('email');
  const handleFocusPassword = () => setFocusState('password');
  const handleBlurInputs = () => setFocusState('idle');

  const handleKeyDown = () => {
    setTypingCounter(c => c + 1);
  };

  const isConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return 'Too Short';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-slate-200';
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] dark:bg-slate-900 animate-fade-in">
        <div className="w-full max-w-lg p-8 space-y-4 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Configuration Needed</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Welcome to Diary! To get started, you need to connect the app to your own Supabase project.
          </p>
          {/* Config instructions omitted for brevity but would remain here */}
        </div>
      </div>
    );
  }
  
  const getFriendlyErrorMessage = (error: any) => {
    // Check for network errors (often manifest as "Failed to fetch" TypeError)
    if (
      (error?.name === 'TypeError' && error?.message === 'Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('connection')
    ) {
      return "Network Error: Unable to connect to the server. Please check your internet connection and firewall settings.";
    }
    return error.error_description || error.message || "An unexpected error occurred.";
  };

  const handleSignUp = async () => {
      const { error } = await (supabase.auth as any).signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: 'https://aklabx.github.io/diary/'
        }
      });
      if (error) throw error;
      addToast('Check your email for the confirmation link!', 'success');
  }

  const handleSignIn = async () => {
      const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
      if (error) throw error;
  }
  
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://aklabx.github.io/diary/'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(getFriendlyErrorMessage(error));
      setLoading(false);
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
      setError(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  
  const emailProgress = Math.min(email.length / 30, 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] dark:bg-slate-900 animate-fade-in relative p-4">
      
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Home
      </button>

      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        <Monkey 
          focusState={focusState}
          emailProgress={emailProgress}
          typingCounter={typingCounter}
          isPasswordVisible={isPasswordVisible}
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
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 transition-all"
            autoComplete="username"
          />
          
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
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
              className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 transition-all"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button 
              type="button" 
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.042 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 8.138 15.522 6 10 6c-1.55 0-2.998.48-4.257 1.254l-1.74-1.741zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  <path d="M2.042 10c.832 2.345 3.16 4 5.918 4 1.55 0 2.998-.48 4.257-1.254l-1.473-1.473A3.999 3.999 0 0110 14c-2.209 0-4-1.791-4-4a3.999 3.999 0 011.21-2.828L5.293 5.293A10.014 10.014 0 00.458 10c1.274 1.862 4.022 4 9.542 4 1.105 0 2.158-.149 3.168-.43L10.373 12.16A4.003 4.003 0 0110 12z" />
                </svg>
              )}
            </button>
          </div>

          {/* Password Strength Indicator (Only for Sign Up) */}
          {isSignUp && password.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex gap-1 h-1.5 w-full">
                <div className={`h-full rounded-full flex-1 transition-all duration-300 ${passwordStrength >= 1 ? getStrengthColor() : 'bg-slate-100 dark:bg-slate-700'}`} />
                <div className={`h-full rounded-full flex-1 transition-all duration-300 ${passwordStrength >= 2 ? getStrengthColor() : 'bg-slate-100 dark:bg-slate-700'}`} />
                <div className={`h-full rounded-full flex-1 transition-all duration-300 ${passwordStrength >= 3 ? getStrengthColor() : 'bg-slate-100 dark:bg-slate-700'}`} />
                <div className={`h-full rounded-full flex-1 transition-all duration-300 ${passwordStrength >= 4 ? getStrengthColor() : 'bg-slate-100 dark:bg-slate-700'}`} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Strength</span>
                <span className={`font-medium ${
                  passwordStrength < 2 ? 'text-red-500' : 
                  passwordStrength < 4 ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {getStrengthLabel()}
                </span>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 disabled:bg-indigo-300 transition-all transform active:scale-95 shadow-lg shadow-indigo-500/30">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-.white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
            </div>
        </div>
        
        <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 dark:disabled:bg-slate-700 transition-colors"
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
      </div>
    </div>
  );
};

export default Auth;