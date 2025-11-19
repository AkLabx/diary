import React, { useEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import DOMPurify from 'dompurify';
import { formatFullTimestamp, formatRelativeTime } from '../lib/dateUtils';
import SecureAudioPlayer from './SecureAudioPlayer';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';

interface DiaryEntryViewProps {
  entry: DiaryEntry;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const DiaryEntryView: React.FC<DiaryEntryViewProps> = ({ entry, onEdit, onDelete, onBack }) => {
  const fullDate = formatFullTimestamp(entry.created_at);
  const relativeTime = formatRelativeTime(entry.created_at);
  const contentRef = useRef<HTMLDivElement>(null);
  const { key, decryptBinary } = useCrypto();

  useEffect(() => {
      // Decrypt secure images
      const decryptImages = async () => {
          if (!contentRef.current || !key) return;

          const images = contentRef.current.querySelectorAll('img.secure-diary-image');
          
          images.forEach(async (imgElement) => {
              const img = imgElement as HTMLImageElement;
              const altData = img.getAttribute('alt');
              // Only process if we have the metadata and haven't already decrypted (check src)
              if (altData && !img.src.startsWith('blob:')) {
                  try {
                      const metadata = JSON.parse(altData);
                      if (metadata.path && metadata.iv) {
                          // Show loading state (half opacity)
                          img.style.opacity = '0.5';
                          img.style.transition = 'opacity 0.3s';

                          const { data: encryptedBlob, error } = await supabase.storage
                              .from('diary-images')
                              .download(metadata.path);
                          
                          if (error) throw error;
                          
                          const encryptedBuffer = await encryptedBlob.arrayBuffer();
                          const decryptedBuffer = await decryptBinary(key, encryptedBuffer, metadata.iv);
                          
                          const decryptedBlob = new Blob([decryptedBuffer], { type: 'image/webp' });
                          const url = URL.createObjectURL(decryptedBlob);
                          
                          img.src = url;
                          img.style.opacity = '1';
                      }
                  } catch (e) {
                      console.error("Failed to decrypt image:", e);
                  }
              }
          });
      };

      if (entry.isDecrypted) {
          decryptImages();
      }
      
      // Cleanup function to revoke object URLs when component unmounts or entry changes
      return () => {
          if (contentRef.current) {
               const images = contentRef.current.querySelectorAll('img.secure-diary-image');
               images.forEach((img) => {
                   const src = (img as HTMLImageElement).src;
                   if (src.startsWith('blob:')) {
                       URL.revokeObjectURL(src);
                   }
               });
          }
      };
  }, [entry.isDecrypted, entry.content, key, decryptBinary]);


  if (!entry.isDecrypted) {
      return (
         <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-slate-500 dark:text-slate-400">Decrypting entry...</p>
            </div>
         </div>
      );
  }

  // DOMPurify v3 removed ALLOWED_CSS_PROPS. We use a hook to achieve the same result for image styling.
  const allowedCssProps = ['width', 'float', 'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'text-align', 'opacity', 'transition'];
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Check if the node is an element and has a style attribute
    if (node instanceof Element && node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const sanitizedStyle = style.split(';').filter(prop => {
        if (!prop.includes(':')) return false;
        const propName = prop.split(':')[0].trim();
        return propName && allowedCssProps.includes(propName);
      }).join(';');
      
      // If there are any allowed styles left, set the attribute, otherwise remove it.
      if (sanitizedStyle) {
        node.setAttribute('style', sanitizedStyle);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  const sanitizedContent = DOMPurify.sanitize(entry.content, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['style', 'class', 'alt', 'data-secure-path', 'data-iv'], // Allow attributes needed for decryption
  });
  
  // It's good practice to remove hooks after use to prevent side-effects.
  DOMPurify.removeHook('afterSanitizeAttributes');


  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Timeline
      </button>

      <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{entry.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {fullDate} ({relativeTime})
          </p>
        </div>
         <div className="flex items-center gap-4 mt-3">
          {entry.mood && <span className="text-3xl" aria-label={`Mood: ${entry.mood}`}>{entry.mood}</span>}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map(tag => (
                <span key={tag} className="text-sm font-medium bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Audio Player */}
      {entry.audio && (
          <div className="my-6">
              <SecureAudioPlayer 
                  path={entry.audio.path} 
                  iv={entry.audio.iv} 
                  mimeType={entry.audio.type}
              />
          </div>
      )}

      <div 
        ref={contentRef}
        className="prose prose-slate dark:prose-invert max-w-none my-6"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6 flex justify-end gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DiaryEntryView;