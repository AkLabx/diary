import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { DiaryEntry } from '../types';
import ReactQuill from 'react-quill';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';
import { useBlocker } from 'react-router-dom';
import * as autoSave from '../lib/autoSave';

// --- Quill Customization ---
const Quill = (ReactQuill as any).Quill; 
if (Quill) {
    // Import the base Image Blot
    const BaseImage = Quill.import('formats/image');

    // Extend the Image Blot to support our custom attributes natively
    class SecureImage extends BaseImage {
        static create(value: any) {
            // Allow creating from a string (normal URL) or an object (our custom secure data)
            const node = super.create(typeof value === 'string' ? value : value.src);
            
            if (typeof value === 'object') {
                if (value.alt) node.setAttribute('alt', value.alt);
                if (value.className) node.setAttribute('class', value.className);
                if (value.dataset?.secureMetadata) {
                     node.setAttribute('data-secure-metadata', value.dataset.secureMetadata);
                }
            }
            return node;
        }

        static value(node: HTMLElement) {
            return {
                src: node.getAttribute('src'),
                alt: node.getAttribute('alt'),
                className: node.getAttribute('class'),
                dataset: {
                    secureMetadata: node.getAttribute('data-secure-metadata')
                }
            };
        }
    }
    
    // Explicitly define the blotName and tagName so it overrides the default 'image'
    SecureImage.blotName = 'image';
    SecureImage.tagName = 'IMG';

    Quill.register(SecureImage, true);

    // Register style attributors so Quill knows how to handle resize/align styles
    const Parchment = Quill.import('parchment');
    const widthStyle = new Parchment.Attributor.Style('width', 'width');
    const floatStyle = new Parchment.Attributor.Style('float', 'float');
    const marginStyle = new Parchment.Attributor.Style('margin', 'margin');
    
    Quill.register(widthStyle, true);
    Quill.register(floatStyle, true);
    Quill.register(marginStyle, true);

    const AlignStyle = Quill.import('attributors/style/align');
    Quill.register(AlignStyle, true);
}
// --- End Quill Customization ---

interface DiaryEditorProps {
  entry?: DiaryEntry;
  onSave: (entryData: Omit<DiaryEntry, 'id' | 'owner_id'>) => void;
  onWordCountChange: (count: number) => void;
  onCharacterCountChange: (count: number) => void;
  editorFont: 'serif' | 'sans' | 'mono';
}

export interface EditorHandle {
  save: () => void;
  getEditor: () => ReactQuill['editor'] | undefined;
}

const fontClassMap = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
};

const DiaryEditor = forwardRef<EditorHandle, DiaryEditorProps>(({ entry, onSave, onWordCountChange, onCharacterCountChange, editorFont }, ref) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [isHydrating, setIsHydrating] = useState(false);

  // Track initial state to determine dirtiness
  const [initialTitle, setInitialTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const quillRef = useRef<ReactQuill>(null);
  const loadedIdRef = useRef<string | null>('INITIAL_MOUNT');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { addToast } = useToast();
  const { key, encryptBinary, decryptBinary } = useCrypto();

  // "The Guardian": Block internal navigation if dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
      if (blocker.state === 'blocked') {
          const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave?");
          if (confirmLeave) {
              blocker.proceed();
          } else {
              blocker.reset();
          }
      }
  }, [blocker]);

  // "The Guardian": Block external navigation (browser refresh/close)
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (isDirty) {
              e.preventDefault();
              e.returnValue = ''; // Required for Chrome
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);


  // Helper to hydrate secure images (decrypt them)
  const hydrateSecureImages = useCallback(async (htmlContent: string, editor: any) => {
      if (!key || !htmlContent.includes('secure-diary-image')) return;

      // We need to work on the actual DOM nodes managed by Quill
      const root = editor.root as HTMLElement;
      const images = root.querySelectorAll('img.secure-diary-image');

      for (let i = 0; i < images.length; i++) {
          const img = images[i] as HTMLImageElement;
          const rawSrc = img.getAttribute('src');
          // Look for metadata in the new data attribute first, fallback to alt for legacy support
          const metadataStr = img.getAttribute('data-secure-metadata') || img.getAttribute('alt');

          // Skip if already decrypted (blob url) or no metadata
          if (rawSrc?.startsWith('blob:') || !metadataStr) continue;

          try {
              const metadata = JSON.parse(metadataStr);
              if (metadata && metadata.path && metadata.iv) {
                   img.style.opacity = '0.5';
                   
                   // Use createSignedUrl here as well
                   const { data: signedData, error: signedError } = await supabase.storage
                      .from('diary-images')
                      .createSignedUrl(metadata.path, 60);

                   if (signedError) throw signedError;

                   const response = await fetch(signedData.signedUrl);
                   if (!response.ok) throw new Error(`Failed to fetch image blob: ${response.status}`);

                   const encryptedBuffer = await response.arrayBuffer();
                   const decryptedBuffer = await decryptBinary(key, encryptedBuffer, metadata.iv);
                   
                   const decryptedBlob = new Blob([decryptedBuffer], { type: 'image/webp' });
                   const url = URL.createObjectURL(decryptedBlob);
                   
                   img.src = url;
                   img.style.opacity = '1';
              }
          } catch (e) {
              console.error("Failed to decrypt image in editor", e);
          }
      }
  }, [key, decryptBinary]);


  useEffect(() => {
    const incomingId = entry?.id || 'draft';
    
    // Only reset state if the entry ID actually changes
    if (loadedIdRef.current === incomingId) {
        return;
    }
    loadedIdRef.current = incomingId;

    const loadEntry = async () => {
        let loadedTitle = '';
        let loadedContent = '';
        let loadedDate = new Date();

        // 1. Load from props first
        if (entry) {
            loadedTitle = entry.title;
            loadedContent = entry.content;
            loadedDate = new Date(entry.created_at);
        } else {
            loadedTitle = "Today's diary entry...";
            loadedContent = "";
        }

        // 2. Check "The Black Box" (Auto-Save) for a newer local draft
        try {
            const draft = await autoSave.getDraft(incomingId);
            if (draft && key) {
                // If draft is newer than entry (or if entry is null/new), use draft
                const entryTime = entry ? new Date(entry.updated_at || entry.created_at).getTime() : 0;
                if (draft.timestamp > entryTime) {
                    console.log("Restoring from auto-save draft...");
                    const decryptedBuffer = await decryptBinary(key, await draft.encryptedData.arrayBuffer(), draft.iv);
                    const decryptedString = new TextDecoder().decode(decryptedBuffer);
                    const draftData = JSON.parse(decryptedString);

                    if (draftData.title !== undefined) loadedTitle = draftData.title;
                    if (draftData.content !== undefined) loadedContent = draftData.content;

                    addToast("Restored unsaved draft", "success");
                }
            }
        } catch (e) {
            console.error("Failed to restore draft", e);
        }

        setTitle(loadedTitle);
        setContent(loadedContent);
        setEntryDate(loadedDate);
        setInitialTitle(loadedTitle);
        setInitialContent(loadedContent);
        setIsDirty(false); // Reset dirty state after load

        const hasSecureImages = loadedContent.includes('secure-diary-image');
        setIsHydrating(hasSecureImages);

        setTimeout(async () => {
            if (quillRef.current) {
                if (hasSecureImages) {
                    await hydrateSecureImages(loadedContent, quillRef.current.getEditor());
                    setIsHydrating(false);
                }
            }
        }, 100);
    };

    loadEntry();

  }, [entry, hydrateSecureImages, key, decryptBinary, addToast]);

  useEffect(() => {
    const text = content.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length === 1 && words[0] === '' ? 0 : words.length;
    onWordCountChange(wordCount);
    onCharacterCountChange(text.length);
  }, [content, onWordCountChange, onCharacterCountChange]);

  // Dirty Check Logic
  useEffect(() => {
      // Simple string comparison for dirty check
      // Note: Quill might change HTML slightly, so strict equality is tricky but okay for now
      const dirty = title !== initialTitle || content !== initialContent;
      setIsDirty(dirty);
  }, [title, content, initialTitle, initialContent]);

  // "The Black Box": Auto-Save Logic
  useEffect(() => {
      if (!isDirty || !key) return;

      // Debounce auto-save
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(async () => {
          const idToSave = entry?.id || 'draft';
          try {
              const dataToEncrypt = JSON.stringify({ title, content });
              const buffer = new TextEncoder().encode(dataToEncrypt);

              // Correctly passing ArrayBuffer by accessing .buffer
              const { iv, data } = await encryptBinary(key, buffer.buffer);

              const blob = new Blob([data], { type: 'application/octet-stream' });

              await autoSave.saveDraft(idToSave, blob, iv);
              console.log("Auto-saved draft to IndexedDB");
          } catch (e) {
              console.error("Auto-save failed", e);
          }
      }, 2000); // 2 seconds debounce

      return () => {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      }
  }, [title, content, isDirty, key, encryptBinary, entry]);

  
  const handleInternalSave = useCallback(async () => {
     const isContentEmpty = !content || content.replace(/<(.|\n)*?>/g, '').trim().length === 0;
     if (title.trim() === '' || isContentEmpty) {
      addToast('Please provide a title and some content for your entry.', 'error');
      return;
    }
    const currentData = entry || {};
    onSave({ 
        ...currentData,
        title, 
        content, 
        created_at: entryDate.toISOString(),
        tags: entry?.tags,
        mood: entry?.mood
    });

    // "The Black Box": Clear draft on successful manual save intent
    // Note: Ideally we wait for actual success, but this is 'optimistic' cleanup
    // or we can rely on next load to see that entry is newer than draft.
    // Explicitly deleting is cleaner.
    const idToDelete = entry?.id || 'draft';
    await autoSave.deleteDraft(idToDelete);
    setInitialTitle(title);
    setInitialContent(content);
    setIsDirty(false);

  }, [title, content, entryDate, entry, onSave, addToast]);

  useImperativeHandle(ref, () => ({
    save: handleInternalSave,
    getEditor: () => quillRef.current?.getEditor(),
  }), [handleInternalSave]);

  const modules = useMemo(() => ({
    toolbar: false,
  }), []);
  
  const fontClass = fontClassMap[editorFont];

  return (
    <div className={`h-full flex flex-col paper-canvas rounded-lg overflow-hidden ${fontClass}`}>
        <div className="p-4 sm:p-6 md:px-8 border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent focus:outline-none focus:ring-0 border-none p-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Today's diary entry..."
            />
        </div>
        <div className="flex-grow overflow-y-auto relative">
            {isHydrating && (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 space-y-6 animate-fade-in">
                     <div className="space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
                     </div>
                     
                     <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg w-full animate-pulse flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                     </div>

                     <div className="space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5 animate-pulse"></div>
                     </div>
                </div>
            )}
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                className={`prose-editor transition-opacity duration-500 ${isHydrating ? 'opacity-0' : 'opacity-100'}`}
                placeholder="Start writing here..."
                modules={modules}
            />
        </div>
    </div>
  );
});

export default DiaryEditor;
