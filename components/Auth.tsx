import React, { useState } from 'react';
import { supabase, supabaseUrl, supabaseKey } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';
import { generateSalt, deriveKey, encrypt, deriveAndVerifyKey, KEY_CHECK_STRING } from '../lib/crypto';


const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setKey } = useCrypto();

  const isConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-lg p-8 space-y-4 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-slate-800">Configuration Needed</h1>
          <p className="text-slate-600">
            Welcome to Diary! To get started, you need to connect the app to your own Supabase project.
          </p>
          <div className="text-sm text-left text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200">
            <p className="font-semibold mb-2">Please follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to the file <code className="font-mono bg-slate-200 px-1.5 py-1 rounded">lib/supabaseClient.ts</code> in your project.</li>
              <li>Replace the placeholder values for <code className="font-mono bg-slate-200 px-1.5 py-1 rounded">supabaseUrl</code> and <code className="font-mono bg-slate-200 px-1.5 py-1 rounded">supabaseKey</code> with the credentials from your Supabase project's API settings.</li>
              <li>Make sure you have run the SQL scripts in that file to create the `profiles` and `diaries` tables.</li>
              <li>Save the file. The app will automatically reload.</li>
            </ol>
          </div>
           <p className="text-xs text-slate-400 pt-2">
            If you don't have a Supabase project, you can create one for free at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">supabase.com</a>.
          </p>
        </div>
      </div>
    );
  }
  
  const handleSignUp = async () => {
      // The new trigger in Supabase will create the profile row automatically.
      // We just need to sign the user up.
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Check your email for the confirmation link!');
  }

  const handleSignIn = async () => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!user) throw new Error("Sign in failed, no user returned.");

      // Check if this is the first time the user is logging in by looking for placeholder salt.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) throw profileError || new Error("Profile not found");

      if (profile.salt === 'INITIAL_SALT') {
        // This is the first login. Generate real encryption materials and update the profile.
        const salt = generateSalt();
        const key = await deriveKey(password, salt);
        const { iv: key_check_iv, data: key_check_value } = await encrypt(key, KEY_CHECK_STRING);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ salt, key_check_value, key_check_iv })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
        setKey(key); // Set the key for the current session
      } else {
        // This is a normal login. Derive and verify the key as usual.
        const key = await deriveAndVerifyKey(password, user.id);
        if (key) {
          setKey(key);
        } else {
          await supabase.auth.signOut();
          throw new Error("Incorrect password or corrupt profile data. Could not decrypt diary key.");
        }
      }
  }

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
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800">Diary</h1>
            <p className="text-slate-500 mt-2">{isSignUp ? 'Create a secure, encrypted account.' : 'Sign in to access your journal.'}</p>
        </div>

        {error && <p className="text-center text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Your password (min 6 characters)"
            value={password}
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-300">
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <p className="text-xs text-center text-slate-400">
            Note: For security, password reset is not supported. If you forget your password, your encrypted data will be unrecoverable.
        </p>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or</span>
            </div>
        </div>

        <p className="text-center text-sm text-slate-500">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => {setIsSignUp(!isSignUp); setError(null)}} className="font-medium text-indigo-600 hover:text-indigo-500">
                {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;