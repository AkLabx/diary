import React, { useEffect, useRef, useState } from 'react';
import { DiaryEntry } from '../types';
import DOMPurify from 'dompurify';
import { formatFullTimestamp, formatRelativeTime } from '../lib/dateUtils';
import SecureAudioPlayer from './SecureAudioPlayer';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';
import Lightbox from './Lightbox';
import { usePersonalTasks } from '../contexts/TaskContext';

interface DiaryEntryViewProps {
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  animationClass?: string;
  entry: DiaryEntry;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const DiaryEntryView: React.FC<DiaryEntryViewProps> = ({ entry, onEdit, onDelete, onBack, onNext, onPrev, hasNext, hasPrev, animationClass = 'animate-fade-in' }) => {
  const fullDate = formatFullTimestamp(entry.created_at);
  const relativeTime = formatRelativeTime(entry.created_at);
  const contentRef = useRef<HTMLDivElement>(null);
  const { tasks, toggleTask, createTask } = usePersonalTasks();
  const [isAddingLinkedTask, setIsAddingLinkedTask] = useState(false);
  const [linkedTaskTitle, setLinkedTaskTitle] = useState('');
  const linkedTasks = tasks.filter(t => t.entry_id === entry.id);

  const handleAddLinkedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedTaskTitle.trim()) return;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await createTask(
      { title: linkedTaskTitle.trim() },
      {
        due_date: todayStr,
        category_code: 0,
        energy_level: 1,
        importance_level: 2,
        entry_id: entry.id,
      }
    );
    setLinkedTaskTitle('');
    setIsAddingLinkedTask(false);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;

    if (Math.abs(deltaX) > 50) { // Minimum swipe distance
      if (deltaX > 0 && onNext && hasNext) {
        // Swiped left
        onNext();
      } else if (deltaX < 0 && onPrev && hasPrev) {
        // Swiped right
        onPrev();
      }
    }
    setTouchStartX(null);
  };

  const { key, decryptBinary } = useCrypto();
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  useEffect(() => {
      // Decrypt secure images
      const decryptImages = async () => {
          if (!contentRef.current || !key) return;

          const images = contentRef.current.querySelectorAll('img.secure-diary-image');
          
          const imageList: { img: HTMLImageElement; path: string; iv: string }[] = [];
          for (let i = 0; i < images.length; i++) {
              const img = images[i] as HTMLImageElement;
              const metadataStr = img.getAttribute('data-secure-metadata') || img.getAttribute('alt');
              if (metadataStr && !img.src.startsWith('blob:')) {
                  try {
                      const metadata = JSON.parse(metadataStr);
                      if (metadata.path && metadata.iv) {
                          img.style.opacity = '0.5';
                          img.style.transition = 'opacity 0.3s';
                          img.style.cursor = 'zoom-in';
                          imageList.push({ img, path: metadata.path, iv: metadata.iv });
                      }
                  } catch (e) {
                      console.warn("Failed to parse image metadata", e);
                  }
              }
          }

          if (imageList.length === 0) return;

          // Batch signed URLs request (single roundtrip instead of N queries)
          const paths = imageList.map(item => item.path);
          const { data: signedUrls, error: signedError } = await supabase.storage
              .from('diary-images')
              .createSignedUrls(paths, 300); // 5 minutes validity

          const urlMap = new Map<string, string>();
          if (!signedError && signedUrls) {
              signedUrls.forEach(item => {
                  if (item.signedUrl && item.path) urlMap.set(item.path, item.signedUrl);
              });
          }

          // Fetch and decrypt images
          for (const item of imageList) {
              try {
                  let signedUrl = urlMap.get(item.path);
                  if (!signedUrl) {
                      const { data: single } = await supabase.storage.from('diary-images').createSignedUrl(item.path, 300);
                      signedUrl = single?.signedUrl;
                  }
                  if (!signedUrl) throw new Error("Could not obtain signed URL");

                  const response = await fetch(signedUrl);
                  if (!response.ok) throw new Error(`Failed to fetch image blob: ${response.status}`);
                  
                  const encryptedBuffer = await response.arrayBuffer();
                  const decryptedBuffer = await decryptBinary(key, encryptedBuffer, item.iv);
                  
                  const decryptedBlob = new Blob([decryptedBuffer], { type: 'image/webp' });
                  const url = URL.createObjectURL(decryptedBlob);
                  
                  item.img.src = url;
                  item.img.style.opacity = '1';
              } catch (e) {
                  console.error("Failed to decrypt image:", e);
                  item.img.style.border = "2px solid red";
                  item.img.title = "Decryption failed";
              }
          }
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

  // Handle Image Click for Lightbox
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('secure-diary-image')) {
          const src = (target as HTMLImageElement).src;
          if (src && src.startsWith('blob:')) {
              setSelectedImageSrc(src);
          }
      }
  };


  if (!entry.isDecrypted) {
      return (
         <div className={`bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 ${animationClass} flex items-center justify-center min-h-[300px]`}>
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

  // DOMPurify config for secure images and captions
  const allowedCssProps = ['width', 'float', 'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'text-align', 'opacity', 'transition'];

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node instanceof Element && node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const sanitizedStyle = style.split(';').filter(prop => {
        if (!prop.includes(':')) return false;
        const propName = prop.split(':')[0].trim();
        return propName && allowedCssProps.includes(propName);
      }).join(';');
      
      if (sanitizedStyle) {
        node.setAttribute('style', sanitizedStyle);
      } else {
        node.removeAttribute('style');
      }
    }

    // Security enhancement: Prevent reverse tabnabbing on user-generated links
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitizedContent = DOMPurify.sanitize(entry.content, {
    ADD_TAGS: ['img', 'figure', 'figcaption', 'a'], // Allow figure elements and links
    ADD_ATTR: ['style', 'class', 'alt', 'data-secure-metadata', 'contenteditable', 'href', 'target', 'rel'], // Allow necessary attributes
  });
  
  DOMPurify.removeHook('afterSanitizeAttributes');

  // Handle Multi-Audio Rendering
  // Note: We handle legacy single object structure by converting it to array
  const audioList = entry.audio
    ? (Array.isArray(entry.audio) ? entry.audio : [entry.audio])
    : [];

  return (
    <>
        <div
        className={`bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 ${animationClass} mb-20`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        >
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

        {/* Audio Section - Updated for Multi-Audio */}
        {audioList.length > 0 && (
            <div className="my-6 space-y-3">
                {audioList.map((audio: any, index: number) => (
                    <SecureAudioPlayer
                        key={audio.id || index}
                        path={audio.path}
                        iv={audio.iv}
                        mimeType={audio.type}
                    />
                ))}
            </div>
        )}

        <div
            ref={contentRef}
            onClick={handleContentClick}
            className="prose prose-slate dark:prose-invert max-w-none my-6 diary-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {/* Linked Tasks & Action Items */}
        <div className="my-6 p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🌿</span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Linked Tasks
              </h4>
              {linkedTasks.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                  {linkedTasks.filter(t => t.is_completed).length}/{linkedTasks.length} done
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLinkedTask(!isAddingLinkedTask)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              {isAddingLinkedTask ? 'Cancel' : '+ Add Task'}
            </button>
          </div>

          {isAddingLinkedTask && (
            <form onSubmit={handleAddLinkedTask} className="mb-3 flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Add a task related to this entry..."
                value={linkedTaskTitle}
                onChange={e => setLinkedTaskTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="submit"
                disabled={!linkedTaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          {linkedTasks.length > 0 ? (
            <div className="space-y-2">
              {linkedTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                        task.is_completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      {task.is_completed && (
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        task.is_completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.decrypted?.title || '🔒 Private Task'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isAddingLinkedTask && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                No tasks linked to this entry yet.
              </p>
            )
          )}
        </div>

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

        {/* Lightbox Component */}

        {/* Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-10 transition-colors">
            <button
                onClick={onPrev}
                disabled={!hasPrev}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasPrev
                    ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                    : 'text-slate-400 cursor-not-allowed dark:text-slate-600'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
            </button>
            <button
                onClick={onNext}
                disabled={!hasNext}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    hasNext
                    ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                    : 'text-slate-400 cursor-not-allowed dark:text-slate-600'
                }`}
            >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        </div>

        <Lightbox
            src={selectedImageSrc}
            onClose={() => setSelectedImageSrc(null)}
        />
    </>
  );
};

export default DiaryEntryView;