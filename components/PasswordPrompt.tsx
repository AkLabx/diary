import React, { useState, useEffect } from 'react';
import { useCrypto } from '../contexts/CryptoContext';
type Session = any;
import { BiometricData } from '../types';
import { unlockBiometric, isBiometricSupported } from '../lib/webauthn';

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

  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBioSupported, setIsBioSupported] = useState(false);

  useEffect(() => {
      const checkBio = async () => {
          const supported = await isBiometricSupported();
          setIsBioSupported(supported);
          
          const rawData = localStorage.getItem(`diary_bio_${session.user.id}`);
          if (rawData) {
              setHasBiometric(true);
          }
      };
      checkBio();
  }, [session.user.id]);

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

  const handleBiometricUnlock = async () => {
      setLoading(true);
      setError(null);
      try {
          const rawData = localStorage.getItem(`diary_bio_${session.user.id}`);
          if (!rawData) throw new Error("No biometric data found.");
          
          const bioData: BiometricData = JSON.parse(rawData);
          const key = await unlockBiometric(bioData);
          onSuccess(key);
      } catch (err: any) {
          console.error("Biometric unlock failed:", err);
          setError("Biometric unlock failed. Please use your password.");
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
                    autoComplete="current-password"
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
                  {loading ? 'Unlocking...' : 'Unlock with Password'}
              </button>
            </form>

            {isBioSupported && hasBiometric && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                     <button 
                        type="button" 
                        onClick={handleBiometricUnlock}
                        disabled={loading}
                        className="flex flex-col items-center justify-center gap-2 w-full p-4 rounded-lg border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 dark:border-slate-600 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/20 transition-all group"
                     >
                         <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                         </div>
                         <span className="font-semibold text-indigo-600 dark:text-indigo-300">Unlock with Biometrics</span>
                     </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default PasswordPrompt;