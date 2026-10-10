import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';

interface SecureAudioPlayerProps {
  path: string;
  iv: string;
  mimeType?: string;
}

const SecureAudioPlayer: React.FC<SecureAudioPlayerProps> = ({ path, iv, mimeType = 'audio/webm' }) => {
  const { key, decryptBinary } = useCrypto();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'decrypting' | 'ready' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadAudio = async () => {
    if (!key) return;
    setStatus('loading');
    try {
        // 1. Download Encrypted Blob
        const { data: encryptedBlob, error } = await supabase.storage
            .from('diary-audio')
            .download(path);

        if (error) throw error;
        
        setStatus('decrypting');
        
        // 2. Convert to ArrayBuffer
        const encryptedBuffer = await encryptedBlob.arrayBuffer();

        // 3. Decrypt
        const decryptedBuffer = await decryptBinary(key, encryptedBuffer, iv);
        
        // 4. Create URL with correct MIME type
        const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });
        const url = URL.createObjectURL(decryptedBlob);
        
        setAudioUrl(url);
        setStatus('ready');
    } catch (err) {
        console.error("Error loading secure audio:", err);
        setStatus('error');
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (status === 'idle') {
      return (
          <button 
            onClick={loadAudio}
            className="flex items-center gap-3 bg-indigo-50 dark:bg-slate-700 px-4 py-3 rounded-lg border border-indigo-100 dark:border-slate-600 hover:bg-indigo-100 dark:hover:bg-slate-600 transition-colors w-full sm:w-auto"
          >
              <div className="p-2 bg-indigo-500 rounded-full text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                 </svg>
              </div>
              <div className="text-left">
                  <span className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100">Load Audio Memory</span>
                  <span className="block text-xs text-indigo-600 dark:text-slate-400">Encrypted</span>
              </div>
          </button>
      );
  }

  if (status === 'loading' || status === 'decrypting') {
      return (
         <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto animate-pulse">
             <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             <span className="text-sm text-slate-500 dark:text-slate-400">{status === 'loading' ? 'Downloading...' : 'Decrypting...'}</span>
         </div>
      );
  }
  
  if (status === 'error') {
      return (
          <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Failed to load audio.</span>
          </div>
      );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 w-full">
        <audio ref={audioRef} controls className="w-full h-8 focus:outline-none" src={audioUrl!} />
    </div>
  );
};

export default SecureAudioPlayer;