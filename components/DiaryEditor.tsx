import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { DiaryEntry } from '../types';
import ReactQuill from 'react-quill';
import { useToast } from '../contexts/ToastContext';

// --- Quill Customization ---
// We need to get the Quill constructor from the ReactQuill component.
// This allows us to register custom formats before the editor is initialized.
const Quill = (ReactQuill as any).Quill; 
if (Quill) {
    const Image = Quill.import('formats/image');
    // Override the default formats method to include our custom styles
    const oldFormats = Image.formats;
    Image.formats = function(domNode: HTMLElement) {
        const formats = oldFormats.call(this, domNode);
        if (domNode.style.width) formats.width = domNode.style.width;
        if (domNode.style.float) formats.float = domNode.style.float;
        if (domNode.style.margin) formats.margin = domNode.style.margin;
        return formats;
    }

    // Register style attributors so Quill knows how to handle them
    const Parchment = Quill.import('parchment');
    const widthStyle = new Parchment.Attributor.Style('width', 'width');
    const floatStyle = new Parchment.Attributor.Style('float', 'float');
    const marginStyle = new Parchment.Attributor.Style('margin', 'margin');
    Quill.register(widthStyle, true);
    Quill.register(floatStyle, true);
    Quill.register(marginStyle, true);
    // Register align style for block elements (like paragraphs containing images)
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
  const [currentEntryId, setCurrentEntryId] = useState<string | undefined>(entry?.id);

  const quillRef = useRef<ReactQuill>(null);
  const { addToast } = useToast();

  // Track what we last successfully saved to compare against for auto-save
  // We initialize with the props passed in.
  const lastSavedRef = useRef({ title: entry?.title || '', content: entry?.content || '' });

  // Smart Sync Effect: Only update state from props if it's a NEW navigation
  // or a distinct entry change, ignoring re-renders caused by auto-save return.
  useEffect(() => {
    // Normalize IDs for comparison.
    // We treat `undefined` (new entry), `null`, and `''` (draft entry with metadata) as the same logical "new" entity.
    // This is critical for the "Mood/Tag update" scenario where entry.id changes from undefined -> ''
    // without this normalization, the editor would think it's a new entry and reset content to empty.
    const incomingId = entry?.id || 'new_placeholder';
    const currentIdNormalized = currentEntryId || 'new_placeholder';
    
    // If we switched to a different entry entirely
    if (incomingId !== currentIdNormalized) {
        // SPECIAL CASE: Transition from "New" (undefined/empty) to "Saved" (valid UUID)
        // If we just saved a new entry, the ID changes from 'new_placeholder' -> 'UUID'.
        // We want to capture the new ID, but NOT reset the content, because the local state
        // is the most up-to-date version (the user might be typing).
        
        // Logic: If we were 'new' and now we have a real ID (longer than empty/placeholder)
        const isTransitionFromNewToSaved = (currentIdNormalized === 'new_placeholder') && (entry?.id && entry.id.length > 0);

        if (isTransitionFromNewToSaved) {
             setCurrentEntryId(entry!.id);
             // Update our reference point for what "saved" looks like
             if (entry) {
                lastSavedRef.current = { title: entry.title, content: entry.content };
             }
             return;
        }

        // Otherwise, it's a standard navigation to a different entry. Sync full state.
        if (entry) {
          setTitle(entry.title);
          setContent(entry.content);
          setEntryDate(new Date(entry.created_at));
          lastSavedRef.current = { title: entry.title, content: entry.content };
        } else {
          // For new entries, set defaults
          setTitle("Today's diary entry...");
          setContent('');
          setEntryDate(new Date());
          lastSavedRef.current = { title: '', content: '' };
        }
        setCurrentEntryId(entry?.id);
    } else {
        // Even if ID is same, if we received new props (e.g. from a save), update our reference of "truth"
        // This ensures subsequent dirty checks are accurate.
        if (entry) {
             lastSavedRef.current = { title: entry.title, content: entry.content };
        }
    }
  }, [entry, currentEntryId]);

  useEffect(() => {
    const text = content.replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length === 1 && words[0] === '' ? 0 : words.length;
    onWordCountChange(wordCount);
    onCharacterCountChange(text.length);
  }, [content, onWordCountChange, onCharacterCountChange]);
  
  const handleInternalSave = useCallback((isAutoSave = false) => {
     const isContentEmpty = !content || content.replace(/<(.|\n)*?>/g, '').trim().length === 0;
     
     if (title.trim() === '' || isContentEmpty) {
      // If auto-saving, be silent about validation errors to avoid annoying toast spam
      if (!isAutoSave) {
          addToast('Please provide a title and some content for your entry.', 'error');
      }
      return;
    }

    // Update our local ref so we don't auto-save again immediately
    lastSavedRef.current = { title, content };

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

  // Auto-Save Effect
  useEffect(() => {
      // Check if dirty (different from last known saved state)
      const isDirty = title !== lastSavedRef.current.title || content !== lastSavedRef.current.content;
      
      // Also check if it's a new entry that hasn't been saved yet but has content
      const isNewAndDirty = !entry && (title !== "Today's diary entry..." || content !== '');

      if (isDirty || isNewAndDirty) {
          const timer = setTimeout(() => {
              handleInternalSave(true);
          }, 2000); // 2 second debounce

          return () => clearTimeout(timer);
      }
  }, [title, content, entry, handleInternalSave]);

  useImperativeHandle(ref, () => ({
    save: () => handleInternalSave(false),
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