import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { DiaryEntry } from '../types';
import ReactQuill from 'react-quill';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';

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

  const quillRef = useRef<ReactQuill>(null);
  const loadedIdRef = useRef<string | null>('INITIAL_MOUNT');
  
  const { addToast } = useToast();
  const { key, decryptBinary } = useCrypto();

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
              console.error("Failed to decrypt image in editor", e);
          }
      }
  }, [key, decryptBinary]);


  useEffect(() => {
    const incomingId = entry?.id || 'draft';
    
    if (loadedIdRef.current === incomingId) {
        return;
    }

    loadedIdRef.current = incomingId;

    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setEntryDate(new Date(entry.created_at));
      
      setTimeout(() => {
          if (quillRef.current) {
              hydrateSecureImages(entry.content, quillRef.current.getEditor());
          }
      }, 100);

    } else {
      setTitle("Today's diary entry...");
      setContent(""); 
      setEntryDate(new Date());
    }
  }, [entry, hydrateSecureImages]);

  useEffect(() => {
    const text = content.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length === 1 && words[0] === '' ? 0 : words.length;
    onWordCountChange(wordCount);
    onCharacterCountChange(text.length);
  }, [content, onWordCountChange, onCharacterCountChange]);
  
  const handleInternalSave = useCallback(() => {
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
        <div className="flex-grow overflow-y-auto">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                className="prose-editor"
                placeholder="Start writing here..."
                modules={modules}
            />
        </div>
    </div>
  );
});

export default DiaryEditor;