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
  const { entries, saveEntry, loadEntryContent, key, encryptBinary, session, uniqueJournals, registerSaveHandler, isToolsPanelVisible } = useDiary();

  const [entry, setEntry] = useState<DiaryEntry | 'new' | null>(null);

  // Editor State
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [editorFont, setEditorFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<SelectedImageFormat | null>(null);

  const editorRef = useRef<EditorHandle>(null);

  // Register the save handler with the layout
  useEffect(() => {
    registerSaveHandler(() => {
        if (editorRef.current) {
            editorRef.current.save();
        }
    });
    // Cleanup not strictly necessary as register will overwrite, but good practice
    return () => registerSaveHandler(() => {});
  }, [registerSaveHandler]);

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

         {/* ToolsPanel - Desktop (Sidebar) or Mobile (Overlay) */}
         <div className={`
             fixed inset-y-0 right-0 z-30 w-72 bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:shadow-none lg:w-64 lg:border-l border-slate-200 dark:border-slate-800
             ${isToolsPanelVisible ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
         `}>
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

         {/* Mobile Overlay Backdrop */}
         {isToolsPanelVisible && (
             <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
                onClick={() => {
                    // We can't toggle directly here easily without adding toggle function to context,
                    // but for now relying on the TopBar toggle is okay, or we can add it later.
                    // Ideally, we should close it.
                    // NOTE: Since we didn't add toggleToolsPanel to context, user must click the gear icon to close.
                    // Or we can add it to context in a future improvement.
                }}
             />
         )}
    </div>
  );
};

export default Editor;