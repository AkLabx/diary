import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateSalt, deriveKey, encrypt, exportKey, KEY_CHECK_STRING } from '../lib/crypto';
import { generateRecoveryKit } from '../lib/recoveryKit';

type Session = any;


interface InitializeEncryptionProps {
  onSuccess: (key: CryptoKey) => void;
  session: Session;
}

interface RecoveryData {
    key: CryptoKey;
    rawKey: string;
    salt: string;
    password: string;
    email: string;
}

const InitializeEncryption: React.FC<InitializeEncryptionProps> = ({ onSuccess, session }) => {
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Recovery Kit State
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null);
  const [hasDownloadedKit, setHasDownloadedKit] = useState(false);

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
        
        const rawSalt = generateSalt();
        // SECURITY UPGRADE: Use 600,000 iterations for new accounts (OWASP recommended).
        // We prefix the salt so the app knows to use 600k instead of the legacy 100k.
        const salt = `v1:600000:${rawSalt}`;
        
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
        
        const rawKey = await exportKey(key);
        
        setRecoveryData({
            key,
            rawKey,
            salt,
            password,
            email: user.email || 'Unknown Email'
        });

    } catch (err: any) {
        setError(err.error_description || err.message || "An unknown error occurred during setup.");
        console.error("Encryption initialization failed:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadKit = () => {
    if (!recoveryData) return;
    generateRecoveryKit({
        email: recoveryData.email,
        password: recoveryData.password,
        salt: recoveryData.salt,
        rawKey: recoveryData.rawKey
    });
    setHasDownloadedKit(true);
  };

  const handleContinue = () => {
      if (recoveryData) {
          onSuccess(recoveryData.key);
      }
  };
  
  if (recoveryData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border-t-4 border-green-500 animate-fade-in">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Setup Complete!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Your secure diary is ready.</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
                    <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Important: Backup Required
                    </h3>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        Because we can't reset your password, you <strong>must</strong> download your Recovery Kit. It contains your password and raw encryption keys.
                    </p>
                </div>

                <button 
                    onClick={handleDownloadKit}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-all shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Recovery Kit
                </button>

                <button 
                    onClick={handleContinue}
                    disabled={!hasDownloadedKit}
                    className="w-full px-4 py-2 font-semibold text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 transition-colors dark:bg-transparent dark:text-indigo-400 dark:hover:text-indigo-300 dark:disabled:text-slate-600"
                >
                    {hasDownloadedKit ? "Continue to App" : "Download Kit to Continue"}
                </button>
            </div>
        </div>
      );
  }

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
                    autoComplete="new-password"
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
              <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
                      <input
                          type="checkbox"
                          checked={agreedToPrivacy}
                          onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500"
                          required
                      />
                      <span>I have read and agree to the <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Privacy Policy</Link>.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-600 dark:text-slate-400">
                      <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500"
                          required
                      />
                      <span>I have read and agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Terms of Use</Link>.</span>
                  </label>
              </div>
              <button 
                type="submit" 
                disabled={loading || !agreedToPrivacy || !agreedToTerms} 
                className="w-full px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                  {loading ? 'Securing...' : 'Initialize Diary'}
              </button>
            </form>
        </div>
    </div>
  );
};

export default InitializeEncryption;