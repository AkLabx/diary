import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateSalt, deriveKey, encrypt, KEY_CHECK_STRING } from '../lib/crypto';
// Fix: Use 'import type' for Session to resolve potential module resolution issues with older Supabase versions.
import type { Session } from '@supabase/supabase-js';


interface InitializeEncryptionProps {
  onSuccess: (key: CryptoKey) => void;
  session: Session;
}

const InitializeEncryption: React.FC<InitializeEncryptionProps> = ({ onSuccess, session }) => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setLoading(true);
    setError(null);

    try {
        const user = session.user;
        if (!user) throw new Error("User not available.");
        
        const salt = generateSalt();
        const key = await deriveKey(password, salt);
        const { iv: key_check_iv, data: key_check_value } = await encrypt(key, KEY_CHECK_STRING);

        // Extract full_name and avatar_url from user metadata if available (e.g., from Google sign-in)
        const fullName = user.user_metadata?.full_name;
        // Google's avatar URL is often in 'picture', so we check both.
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Instead of updating, we now insert the new profile directly.
        // The RLS policy ensures a user can only insert a profile for themselves.
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ 
            id: user.id, 
            salt, 
            key_check_value, 
            key_check_iv,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        
        if (insertError) throw insertError;
        
        onSuccess(key);

    } catch (err: any) {
        setError(err.error_description || err.message || "An unknown error occurred during setup.");
        console.error("Encryption initialization failed:", err);
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Final Security Step</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">To complete your secure setup, please create your password.</p>
            </div>

            <p className="text-xs text-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border dark:border-slate-700">
                This is required to create your unique encryption key. Your password is never stored, and this one-time step ensures your diary remains private and end-to-end encrypted.
            </p>

            {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    required
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
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
                  {loading ? 'Securing...' : 'Initialize Diary'}
              </button>
            </form>
        </div>
    </div>
  );
};

export default InitializeEncryption;