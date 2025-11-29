import React, { useEffect, useState, useRef } from 'react';
import DiaryEditor, { EditorHandle } from '../components/DiaryEditor';
import ToolsPanel from '../components/ToolsPanel';
import StatusBar from '../components/StatusBar';
import { useDiary } from '../DiaryLayout';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { DiaryEntry } from '../types';
import { processImage } from '../lib/imageUtils';

type SelectedImageFormat = { align?: string; width?: string; float?: string };
// Transparent 1x1 placeholder for secure images
const SECURE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface RangeStatic {
  index: number;
  length: number;
}

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { entries, saveEntry, loadEntryContent, key, encryptBinary, session, uniqueJournals } = useDiary();

  const [entry, setEntry] = useState<DiaryEntry | 'new' | null>(null);

  // Editor State
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [editorFont, setEditorFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  // const [isToolsPanelVisible, setToolsPanelVisible] = useState(true); // Unused currently
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<SelectedImageFormat | null>(null);

  const editorRef = useRef<EditorHandle>(null);

  useEffect(() => {
      if (!id) {
          setEntry('new');
      } else {
          const found = entries.find(e => e.id === id);
          if (found) {
              setEntry(found);
              if (!found.isDecrypted && !found.isLoading) {
                  loadEntryContent(id);
              }
          }
      }
  }, [id, entries, loadEntryContent]);

  // Image Handling Logic (Ported from DiaryApp)
  useEffect(() => {
    if (!editorRef.current || !entry) return;
    const quill = editorRef.current.getEditor();
    if (!quill) return;

    const handler = (range: RangeStatic | null) => {
        if (range && range.length === 0) {
            const [blot] = quill.getLeaf(range.index);
            if (blot && blot.statics.blotName === 'image') {
                const formats = quill.getFormat(range.index, 1);
                const parentFormats = quill.getFormat(range.index - 1, 1);
                setSelectedImageFormat({
                    width: formats.width as string,
                    align: parentFormats.align as string,
                    float: formats.float as string,
                });
            } else { setSelectedImageFormat(null); }
        } else if (!range) { setSelectedImageFormat(null); }
    };
    quill.on('selection-change', handler);
    return () => { quill.off('selection-change', handler); };
  }, [entry]);

  const handleImageUpload = async (file: File) => {
    const quill = editorRef.current?.getEditor();
    if (!quill || !key) return;

    setIsUploadingImage(true);
    try {
      const { blob } = await processImage(file);
      const buffer = await blob.arrayBuffer();
      const { iv, data } = await encryptBinary(key, buffer);
      const fileName = `${session.user.id}/${Date.now()}.bin`;
      const encryptedBlob = new Blob([data], { type: 'application/octet-stream' });
      const { error: uploadError } = await supabase.storage.from('diary-images').upload(fileName, encryptedBlob, { contentType: 'application/octet-stream', upsert: false });
      if (uploadError) throw uploadError;

      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      const metadata = JSON.stringify({ path: fileName, iv: iv });

      quill.insertEmbed(range.index, 'image', {
          src: SECURE_PLACEHOLDER,
          alt: "Secure Image",
          className: 'secure-diary-image',
          dataset: { secureMetadata: metadata }
      }, 'user');

      quill.setSelection(range.index + 1, 0, 'user');

      // Preview logic
      setTimeout(() => {
         try {
             const root = editorRef.current?.getEditor()?.root;
             if (!root) return;
             const images = root.querySelectorAll('img.secure-diary-image');
             let targetImg: HTMLImageElement | null = null;
             for (let i = 0; i < images.length; i++) {
                 const img = images[i] as HTMLImageElement;
                 if (img.getAttribute('data-secure-metadata') === metadata) {
                     targetImg = img;
                     break;
                 }
             }
             if (targetImg) {
                 const url = URL.createObjectURL(blob);
                 targetImg.src = url;
                 targetImg.style.opacity = '1';
             }
          } catch(err) { console.error("Preview error:", err); }
      }, 50);

    } catch (error) { console.error("Error uploading image:", error); }
    finally { setIsUploadingImage(false); }
  };

  const handleImageFormatChange = (formats: { [key: string]: any }) => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;
    Object.keys(formats).forEach(formatName => { quill.format(formatName, formats[formatName], 'user'); });
    setTimeout(() => {
        const range = quill.getSelection();
        if(range) (quill as any).emitter.emit('selection-change', range, range, 'user');
    }, 0);
  };


  if (!entry) return <div className="p-8 text-center text-slate-500">Loading editor...</div>;

  return (
    <div className="h-full flex flex-row relative">
         <div className="flex-1 h-full overflow-hidden flex flex-col">
            <DiaryEditor
              ref={editorRef}
              key={id || 'new'}
              entry={entry === 'new' ? undefined : entry}
              onSave={saveEntry}
              onWordCountChange={setWordCount}
              onCharacterCountChange={setCharacterCount}
              editorFont={editorFont}
            />
            <StatusBar
                wordCount={wordCount}
                characterCount={characterCount}
                saveStatus={'synced'}
            />
         </div>

         {/* ToolsPanel is always visible on large screens for now, logic simplified */}
         <div className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden lg:block">
              <ToolsPanel
                  entry={entry}
                      onUpdateEntry={(updates) => {
                           if (entry === 'new') {
                               setEntry(prev => ({
                                   id: '', owner_id: '', title: '', content: '', created_at: new Date().toISOString(),
                                   ...(typeof prev === 'object' ? prev : {}), ...updates
                               } as any));
                           } else {
                               setEntry(prev => ({ ...(prev as DiaryEntry), ...updates }));
                           }
                      }}
                      editorFont={editorFont}
                      onFontChange={setEditorFont}
                      onImageUpload={handleImageUpload}
                      isUploadingImage={isUploadingImage}
                      selectedImageFormat={selectedImageFormat}
                      onImageFormatChange={handleImageFormatChange}
                      availableJournals={uniqueJournals}
                  />
             </div>

         {/* Mobile Tools Overlay? The TopBar usually handles toggling this in mobile view.
             Since TopBar is in Layout, we might need a Portal or Context to control visibility.
             For now, let's keep it simple: On large screens, it's side-by-side. On small screens,
             maybe we should move ToolsPanel into a modal or bottom sheet triggered by TopBar.
             The previous design had it floating.
         */}
    </div>
  );
};

export default Editor;