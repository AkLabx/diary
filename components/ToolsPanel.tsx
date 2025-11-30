import React, { useRef, useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import AudioRecorder from './AudioRecorder';

type SelectedImageFormat = { align?: string; width?: string; float?: string };

interface ToolsPanelProps {
  entry: DiaryEntry | 'new';
  onUpdateEntry: (updates: Partial<DiaryEntry> | Partial<Pick<DiaryEntry, 'tempAudioBlob'>>) => void;
  editorFont: 'serif' | 'sans' | 'mono';
  onFontChange: (font: 'serif' | 'sans' | 'mono') => void;
  onImageUpload: (file: File) => void;
  isUploadingImage: boolean;
  selectedImageFormat: SelectedImageFormat | null;
  onImageFormatChange: (formats: { [key: string]: any }) => void;
  availableJournals: string[];
  onClose?: () => void; // New optional prop for closing the panel
}

const moods = ['😊', '😢', '😠', '😎', '🤔', '😍', '😴', '🥳'];

const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
    entry, 
    onUpdateEntry, 
    editorFont, 
    onFontChange, 
    onImageUpload, 
    isUploadingImage,
    selectedImageFormat,
    onImageFormatChange,
    availableJournals,
    onClose
}) => {
    const currentMood = typeof entry === 'object' ? entry.mood : undefined;
    const currentTags = typeof entry === 'object' ? (entry.tags || []) : [];
    const currentJournal = (typeof entry === 'object' && entry.journal) ? entry.journal : 'Personal';
    const tempAudioBlob = typeof entry === 'object' ? entry.tempAudioBlob : undefined;
    
    // Local state for tag input to allow typing commas/spaces without jitter
    const [tagInput, setTagInput] = useState(currentTags.join(', '));

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local tag input with props only when props change externally (e.g. switching entry or smart tags)
    useEffect(() => {
        const localParsed = tagInput.split(',').map(t => t.trim()).filter(Boolean);
        const propTags = currentTags;
        
        // Check if semantic content is different
        const isDifferent = JSON.stringify(localParsed) !== JSON.stringify(propTags);
        
        // Only override local input if the data is actually different.
        // This allows "tag1," to remain "tag1," locally even if prop is ["tag1"].
        if (isDifferent) {
            setTagInput(propTags.join(', '));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTags]); // We intentionally exclude tagInput to avoid loop on typing

    const handleImageInsertClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
        // Reset file input value to allow uploading the same file again
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleTagInput = (val: string) => {
        setTagInput(val);
        const newTags = val.split(',').map(t => t.trim()).filter(Boolean);
        // Update parent immediately
        onUpdateEntry({ tags: newTags });
    }
    
    const handleMoodUpdate = (newMood: string) => {
        onUpdateEntry({ mood: newMood === currentMood ? undefined : newMood });
    }
    
    const handleJournalUpdate = (val: string) => {
        onUpdateEntry({ journal: val });
    }

    const handleAudioRecorded = (blob: Blob) => {
        onUpdateEntry({ tempAudioBlob: blob });
    }

    const handleAudioDelete = () => {
        onUpdateEntry({ tempAudioBlob: undefined });
    }

    return (
        <aside className="w-64 h-full bg-white/80 dark:bg-slate-900/50 border-l border-[#EAE1D6] dark:border-slate-800 p-4 space-y-6 flex-shrink-0 overflow-y-auto relative">
            {/* Header with Title and Close Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tools</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
                        aria-label="Close Tools Panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
            
             <div className="space-y-4">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Journal</h3>
                    <div className="relative">
                        <input 
                            type="text"
                            list="journal-options"
                            value={currentJournal}
                            onChange={(e) => handleJournalUpdate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Select or type..."
                        />
                        <datalist id="journal-options">
                            {availableJournals.map(j => <option key={j} value={j} />)}
                             {!availableJournals.includes('Personal') && <option value="Personal" />}
                             {!availableJournals.includes('Work') && <option value="Work" />}
                             {!availableJournals.includes('Ideas') && <option value="Ideas" />}
                        </datalist>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Type a new name to create a book.</p>
                </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                {/* Audio Recorder */}
                <AudioRecorder 
                    onRecordingComplete={handleAudioRecorded}
                    existingBlob={tempAudioBlob}
                    onDelete={handleAudioDelete}
                />

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <button 
                    onClick={handleImageInsertClick} 
                    disabled={isUploadingImage}
                    className="w-full flex items-center justify-center gap-3 p-2 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                    {isUploadingImage ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                            <span>Insert Image</span>
                        </>
                    )}
                </button>
                 <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Font Style</h3>
                    <div className="flex flex-col gap-1">
                        <button 
                        onClick={() => onFontChange('serif')} 
                        className={`w-full text-left p-2 rounded-md text-sm font-serif transition-colors ${editorFont === 'serif' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                        Serif (Lora)
                        </button>
                        <button 
                        onClick={() => onFontChange('sans')} 
                        className={`w-full text-left p-2 rounded-md text-sm font-sans transition-colors ${editorFont === 'sans' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                        Sans-Serif
                        </button>
                        <button 
                        onClick={() => onFontChange('mono')} 
                        className={`w-full text-left p-2 rounded-md text-sm font-mono transition-colors ${editorFont === 'mono' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                        Monospace
                        </button>
                    </div>
                </div>
            </div>
            
            {selectedImageFormat && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                     <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Image Tools</h2>
                     <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Size</h3>
                        <div className="grid grid-cols-4 gap-1">
                            {['25%', '50%', '75%', '100%'].map(size => (
                                <button key={size} onClick={() => onImageFormatChange({ width: size })} className={`p-2 text-xs rounded-md ${selectedImageFormat.width === size ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>
                                    {size}
                                </button>
                            ))}
                        </div>
                     </div>
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Alignment</h3>
                        <div className="grid grid-cols-3 gap-1">
                            <button onClick={() => onImageFormatChange({ align: false, float: 'left', margin: '0.5em 1em 0.5em 0' })} className={`p-2 rounded-md flex justify-center ${selectedImageFormat.float === 'left' ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 9a1 1 0 011-1h5a1 1 0 110 2H3a1 1 0 01-1-1zm7 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={() => onImageFormatChange({ align: 'center', float: false, margin: false })} className={`p-2 rounded-md flex justify-center ${selectedImageFormat.align === 'center' ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 9a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                             <button onClick={() => onImageFormatChange({ align: false, float: 'right', margin: '0.5em 0 0.5em 1em' })} className={`p-2 rounded-md flex justify-center ${selectedImageFormat.float === 'right' ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm7 4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                     </div>
                </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Mood</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {moods.map(m => (
                            <button key={m} type="button" onClick={() => handleMoodUpdate(m)} className={`text-2xl p-2 rounded-md transition-all ${currentMood === m ? 'bg-indigo-100 dark:bg-indigo-500/50 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{m}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tags</h3>
                    <textarea 
                        value={tagInput}
                        onChange={(e) => handleTagInput(e.target.value)}
                        placeholder="travel, work..."
                        className="w-full h-20 p-2 text-sm rounded-md bg-slate-100 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>
        </aside>
    );
};

export default ToolsPanel;
