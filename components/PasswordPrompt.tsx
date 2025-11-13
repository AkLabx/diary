import React, { useState } from 'react';
import { useCrypto } from '../contexts/CryptoContext';
import { Session } from '@supabase/supabase-js';

interface PasswordPromptProps {
  onSuccess: (key: CryptoKey) => void;
  session: Session;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSuccess, session }) => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { deriveAndVerifyKey } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const user = session.user;
        if (!user) throw new Error("User not available.");
        
        const key = await deriveAndVerifyKey(password, user.id);

        if (key) {
            onSuccess(key);
        } else {
            setError("Incorrect password. Please try again.");
        }
    } catch (err: any) {
        setError(err.error_description || err.message || "An unknown error occurred.");
        console.error("Key derivation failed:", err);
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Unlock Your Diary</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">For your security, please enter your password to continue.</p>
            </div>

            <p className="text-xs text-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border dark:border-slate-700">
               Your diary is end-to-end encrypted. We need your password to securely decrypt your entries.
            </p>

            {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    aria-label="Password for decryption"
                />
                 <button 
                  type="button" 
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400"
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
              <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300">
                  {loading ? 'Unlocking...' : 'Unlock'}
              </button>
            </form>
        </div>
    </div>
  );
};

export default PasswordPrompt;
