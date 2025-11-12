import React, { useState } from 'react';
import { useCrypto } from '../contexts/CryptoContext';
import { Session } from '@supabase/supabase-js';

interface PasswordPromptProps {
  onSuccess: (key: CryptoKey) => void;
  session: Session;
}

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSuccess, session }) => {
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800">Unlock Your Diary</h1>
                <p className="text-slate-500 mt-2">For your security, please enter your password to continue.</p>
            </div>

            <p className="text-xs text-center text-slate-600 bg-slate-50 p-3 rounded-md border">
               Your diary is end-to-end encrypted. We need your password to securely decrypt your entries.
            </p>

            {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

            <form className="space-y-6" onSubmit={handleSubmit}>
            <input
                type="password"
                placeholder="Your password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Password for decryption"
            />
            <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300">
                {loading ? 'Unlocking...' : 'Unlock'}
            </button>
            </form>
        </div>
    </div>
  );
};

export default PasswordPrompt;
