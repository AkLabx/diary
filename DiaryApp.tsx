import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, ViewState, Profile, Weather } from './types';
import { useCrypto } from './contexts/CryptoContext';
import { useToast } from './contexts/ToastContext';
import { fetchWeather } from './lib/weather';
import { generateSmartTags } from './lib/smartTags';
import { processImage } from './lib/imageUtils';

// Import zip.js classes. Note: well These are provided via importmap in index.html.
// We rely on the import map to resolve '@zip.js/zip.js'.
// @ts-ignore
import { ZipWriter, BlobWriter, TextReader } from '@zip.js/zip.js';

import LeftSidebar from './components/LeftSidebar';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import ToolsPanel from './components/ToolsPanel';
import DiaryList from './components/DiaryList';
import DiaryEntryView from './components/DiaryEntryView';
import DiaryEditor, { EditorHandle } from './components/DiaryEditor';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';
import ProfileView from './components/ProfileView';
import HamburgerMenu from './components/HamburgerMenu';
import ConfirmationModal from './components/ConfirmationModal';
import SmartTagsModal from './components/SmartTagsModal';

interface RangeStatic {
  index: number;
  length: number;
}

interface DiaryAppProps {
  session: Session;
  theme: string;
  onToggleTheme: () => void;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';
type SelectedImageFormat = { align?: string; width?: string; float?: string };

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// Transparent 1x1 placeholder for secure images
const SECURE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const DiaryApp: React.FC<DiaryAppProps> = ({ session, theme, onToggleTheme }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewState>('timeline');
  const [activeJournal, setActiveJournal] = useState<string | null>(null);
  
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | 'new' | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  
  const { key, setKey, encrypt, decrypt, encryptBinary } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [isLeftSidebarVisible, setLeftSidebarVisible] = useState(() => window.innerWidth >= 768);
  
  const [isToolsPanelVisible, setToolsPanelVisible] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'encrypting' | 'error'>('synced');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const editorRef = useRef<EditorHandle>(null);
  const [editorFont, setEditorFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<SelectedImageFormat | null>(null);

  const [isSmartTagsModalOpen, setIsSmartTagsModalOpen] = useState(false);
  const [pendingEntrySave, setPendingEntrySave] = useState<Partial<DiaryEntry> | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  const loadingEntriesRef = useRef<Set<string>>(new Set());

  const { addToast } = useToast();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const weatherData = await fetchWeather(position.coords.latitude, position.coords.longitude);
          setWeather(weatherData);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied. Weather feature disabled.", error.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 60 }
    );
  }, []);

  useEffect(() => {
    const checkKeyStatus = async () => {
      if (key) { setKeyStatus('ready'); return; }
      try {
        const { data } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
        setKeyStatus(data ? 'reauth' : 'needed');
      } catch (error) {
        console.error("Error checking profile:", error);
        addToast("Error accessing profile. Please log out and in again.", "error");
        await supabase.auth.signOut();
      }
    };
    checkKeyStatus();
  }, [key, session.user.id, addToast]);

  const handleKeyReady = (newKey: CryptoKey) => {
    setKey(newKey);
    setKeyStatus('ready');
  };
  
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) { console.error("Error fetching profile:", error); }
  }, [session.user.id]);

  const fetchEntries = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diaries')
        .select('id, created_at, mood, tags, owner_id, journal')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const initialEntries: DiaryEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        mood: entry.mood,
        tags: entry.tags,
        owner_id: entry.owner_id,
        journal: entry.journal || 'Personal',
        title: '',
        content: '',
        isDecrypted: false,
        isLoading: false
      }));

      setEntries(initialEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      addToast("Could not fetch entries.", "error");
    } finally { setLoading(false); }
  }, [key, addToast]);

  const loadEntryContent = useCallback(async (id: string) => {
    if (loadingEntriesRef.current.has(id) || !key) return;

    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    
    if (entries[entryIndex].isDecrypted) return;

    loadingEntriesRef.current.add(id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: true } : e));

    try {
        const { data, error } = await supabase
            .from('diaries')
            .select('encrypted_entry, iv')
            .eq('id', id)
            .single();

        if (error) throw error;

        const decrypted = await decrypt(key, data.encrypted_entry, data.iv);
        const { title, content, audio } = JSON.parse(decrypted);

        setEntries(prev => prev.map(e => e.id === id ? {
            ...e,
            title,
            content,
            audio,
            isDecrypted: true,
            isLoading: false
        } : e));

    } catch (error) {
        console.error(`Error decrypting entry ${id}:`, error);
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: false } : e));
    } finally {
        loadingEntriesRef.current.delete(id);
    }
  }, [entries, key, decrypt]);


  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
      fetchProfile();
    }
  }, [fetchEntries, fetchProfile, keyStatus]);
  
  useEffect(() => {
    if (selectedEntry && !selectedEntry.isDecrypted && !selectedEntry.isLoading) {
        loadEntryContent(selectedEntry.id);
    }
  }, [selectedEntry, loadEntryContent]);
  
  useEffect(() => {
    if (selectedEntry) {
        const updated = entries.find(e => e.id === selectedEntry.id);
        if (updated && (updated.isDecrypted !== selectedEntry.isDecrypted || updated.isLoading !== selectedEntry.isLoading)) {
            setSelectedEntry(updated);
        }
    }
  }, [entries, selectedEntry]);

  useEffect(() => {
    if (!editorRef.current || !editingEntry) return;

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
            } else {
                setSelectedImageFormat(null);
            }
        } else if (!range) {
             setSelectedImageFormat(null);
        }
    };

    quill.on('selection-change', handler);

    return () => {
        quill.off('selection-change', handler);
    };
  }, [editingEntry]);


  const onThisDayEntries = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getDate() === currentDay && entryDate.getFullYear() < today.getFullYear();
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries]);

  const uniqueJournals = useMemo(() => {
      const journals = new Set<string>();
      entries.forEach(e => {
          if (e.journal) journals.add(e.journal);
          else journals.add('Personal');
      });
      return Array.from(journals).sort();
  }, [entries]);
  
  // Helper to cleanup HTML before saving: revert blob URLs to placeholders
  const cleanContentBeforeSave = (htmlContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      const images = doc.querySelectorAll('img.secure-diary-image');
      images.forEach(img => {
          // Revert src to placeholder if it's a blob
          if (img.getAttribute('src')?.startsWith('blob:')) {
              img.setAttribute('src', SECURE_PLACEHOLDER);
          }
      });
      
      return doc.body.innerHTML;
  };

  const executeSave = useCallback(async (entryData: Partial<DiaryEntry> & Pick<DiaryEntry, 'title' | 'content' | 'created_at'>) => {
     if (!key) { addToast("Security session expired.", "error"); return; }
     if (!editingEntry) { addToast("Cannot save: no entry is currently being edited.", "error"); return; }

     setSaveStatus('encrypting');
     try {
       let audioMetadata = null;
       const currentEntryState = editingEntry === 'new' ? {} : editingEntry;
       
       if (entryData.tempAudioBlob) {
            try {
                const buffer = await entryData.tempAudioBlob.arrayBuffer();
                const { iv, data } = await encryptBinary(key, buffer);
                
                const encryptedBlob = new Blob([data], { type: 'application/octet-stream' });
                const fileName = `${session.user.id}/${Date.now()}-audio.bin`;
                
                const { error: uploadError } = await supabase.storage
                    .from('diary-audio')
                    .upload(fileName, encryptedBlob, { upsert: true });

                if (uploadError) throw uploadError;

                audioMetadata = {
                    path: fileName,
                    iv: iv,
                    type: entryData.tempAudioBlob.type
                };
            } catch (err) {
                console.error("Audio upload failed", err);
                addToast("Failed to secure audio. Saving text only.", "error");
            }
       } else if ('audio' in currentEntryState) {
           audioMetadata = currentEntryState.audio;
       }

       const cleanContent = cleanContentBeforeSave(entryData.content);

       const contentToEncrypt = JSON.stringify({ 
           title: entryData.title, 
           content: cleanContent, 
           audio: audioMetadata
       });
       const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);
 
       const isUpdate = typeof editingEntry === 'object' && 'id' in editingEntry && editingEntry.id !== '';
       const record = {
         encrypted_entry, iv,
         mood: entryData.mood, tags: entryData.tags,
         journal: entryData.journal || 'Personal',
         created_at: entryData.created_at
       };
 
       if (isUpdate) {
         const { error } = await supabase.from('diaries').update(record).eq('id', (editingEntry as DiaryEntry).id);
         if (error) throw error;
         
         setEntries(prev => prev.map(e => e.id === (editingEntry as DiaryEntry).id ? { 
             ...e, 
             ...entryData, 
             audio: audioMetadata, 
             isDecrypted: true 
         } as DiaryEntry : e));

       } else {
         const { data, error } = await supabase.from('diaries').insert({ ...record, owner_id: session.user.id }).select('id, created_at, mood, tags, owner_id, journal').single();
         if (error) throw error;
         
         const newEntry: DiaryEntry = { 
             ...data, 
             ...entryData,
             audio: audioMetadata,
             id: data.id,
             isDecrypted: true, 
             isLoading: false 
         } as DiaryEntry;
         
         setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
       }
       addToast('Entry saved!', 'success');
       setEditingEntry(null);
       setActiveView('timeline');
       setLeftSidebarVisible(true);
       setSaveStatus('synced');
       setIsSmartTagsModalOpen(false);
       setPendingEntrySave(null);

     } catch (error) {
       console.error("Error saving entry:", error);
       addToast("Failed to save entry.", "error");
       setSaveStatus('error');
     }
  }, [key, editingEntry, session.user.id, encrypt, encryptBinary, addToast]);

  const handleInitiateSave = useCallback((entryData: Omit<DiaryEntry, 'id' | 'owner_id'>) => {
    const existingTags = entryData.tags || [];
    const suggestions = generateSmartTags(entryData.content);
    const newSuggestions = suggestions.filter(tag => !existingTags.includes(tag));

    if (newSuggestions.length > 0) {
        setPendingEntrySave(entryData);
        setSmartSuggestions(newSuggestions);
        setIsSmartTagsModalOpen(true);
    } else {
        executeSave(entryData);
    }
  }, [executeSave]);

  const handleConfirmSmartTags = (finalTags: string[]) => {
    if (pendingEntrySave) {
        // @ts-ignore
        executeSave({ ...pendingEntrySave, tags: finalTags });
    }
  };

  const handleCancelSmartTags = () => {
     if (pendingEntrySave) {
         // @ts-ignore
         executeSave(pendingEntrySave);
     }
  };

  const requestDeleteEntry = (entry: DiaryEntry) => {
    setEntryToDelete(entry);
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('diaries')
        .delete()
        .eq('id', entryToDelete.id);

      if (error) throw error;
      
      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      addToast('Entry deleted successfully.', 'success');
      setSelectedEntry(null);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Error deleting entry:", error);
      addToast("Failed to delete entry.", "error");
      setEntryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedEntry(null);
    setActiveView('timeline');
  };
  
  const handleJournalSelect = (journal: string | null) => {
      setActiveJournal(journal);
      setActiveView('timeline');
      setSelectedEntry(null);
      setSelectedDate(null);
  }

  const handleBackToTimeline = () => {
    setSelectedEntry(null);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleUpdateProfile = async (updates: { full_name?: string }) => {
    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', session.user.id).select().single();
      if (error) throw error;
      setProfile(data as Profile);
      addToast("Profile updated successfully!", "success");
    } catch (error) {
      addToast("Failed to update profile.", "error");
      console.error("Error updating profile:", error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      // Upload to PRIVATE bucket 'avatars'
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      // For private buckets, we cannot use getPublicUrl.
      // We store the storage PATH in the database.
      // The UI components will generate a Signed URL on the fly.
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: fileName }).eq('id', session.user.id);
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: fileName } : null);
      // Note: Success toast is now handled by the calling component (ProfileView)
    } catch (error) {
      // Removed toast here to let ProfileView handle UI feedback and avoid duplication
      console.error("Error uploading avatar:", error);
      throw error; // Propagate error to caller
    }
  };

  const handleExportData = async (onProgress: (progress: string) => void) => {
    if (!key) return;
    try {
      const { count, error: countError } = await supabase
        .from('diaries')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      const totalEntries = count || 0;
      
      if (totalEntries === 0) {
        addToast("No entries to export.", "info");
        return;
      }

      const blobWriter = new BlobWriter("application/zip");
      const zipWriter = new ZipWriter(blobWriter);

      const BATCH_SIZE = 50;
      let processedCount = 0;
      let currentMonthBuffer: any[] = [];
      let currentMonthKey = "";

      for (let i = 0; i < totalEntries; i += BATCH_SIZE) {
        onProgress(`Processing ${processedCount} / ${totalEntries}`);
        await yieldToMain();

        const { data: batch, error } = await supabase
          .from('diaries')
          .select('*')
          .order('created_at', { ascending: false })
          .range(i, i + BATCH_SIZE - 1);

        if (error) throw error;
        if (!batch) continue;

        for (const entry of batch) {
            try {
                const decryptedString = await decrypt(key, entry.encrypted_entry, entry.iv);
                const content = JSON.parse(decryptedString);
                
                const entryDate = new Date(entry.created_at);
                const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

                if (currentMonthKey && monthKey !== currentMonthKey && currentMonthBuffer.length > 0) {
                     await zipWriter.add(`${currentMonthKey}.json`, new TextReader(JSON.stringify(currentMonthBuffer, null, 2)));
                     currentMonthBuffer = [];
                     await yieldToMain();
                }

                currentMonthKey = monthKey;
                
                currentMonthBuffer.push({
                    id: entry.id,
                    created_at: entry.created_at,
                    title: content.title,
                    content: content.content,
                    tags: entry.tags,
                    mood: entry.mood,
                    journal: entry.journal,
                    audio: content.audio ? "Audio file attached (encrypted, not exported)" : undefined
                });
                
            } catch (err) {
                console.error(`Failed to export entry ${entry.id}`, err);
            }
            processedCount++;
        }
      }

      if (currentMonthBuffer.length > 0) {
          await zipWriter.add(`${currentMonthKey}.json`, new TextReader(JSON.stringify(currentMonthBuffer, null, 2)));
      }
      
      onProgress("Finalizing ZIP...");
      await yieldToMain();
      
      const blob = await zipWriter.close();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diary_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addToast("Export complete!", "success");
      
    } catch (error) {
      console.error("Export failed:", error);
      addToast("Export failed. Please check console.", "error");
    }
  };
  
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

      const { error: uploadError } = await supabase.storage
          .from('diary-images')
          .upload(fileName, encryptedBlob, {
              contentType: 'application/octet-stream',
              upsert: false
          });

      if (uploadError) throw uploadError;
      
      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      const metadata = JSON.stringify({ path: fileName, iv: iv });
      
      // ATOMIC INSERTION: Use our custom 'image' blot which accepts an object.
      // This sets src, alt, class, and data-secure-metadata all at once.
      quill.insertEmbed(range.index, 'image', {
          src: SECURE_PLACEHOLDER,
          alt: "Secure Image", // Simple fallback alt text
          className: 'secure-diary-image',
          dataset: {
              secureMetadata: metadata
          }
      }, 'user');
      
      // Move selection past image
      quill.setSelection(range.index + 1, 0, 'user');
      
      // Instant Preview: Find the specific image we just created
      setTimeout(() => {
          try {
             // Improve robustness: Query for the image with the specific metadata we just added
             // This avoids relying on index or simple alt text which might be duplicate
             const root = editorRef.current?.getEditor()?.root;
             if (!root) return;
             
             // Use CSS.escape if metadata contains characters that break the selector (less likely with JSON stringify but safe)
             // Or simpler: iterate images to find the matching data attribute
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
                 targetImg.style.opacity = '1'; // Reset opacity
             }
          } catch(err) {
              console.error("Preview error:", err);
          }
      }, 50);

    } catch (error) {
      addToast("Failed to upload image.", "error");
      console.error("Error uploading image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const handleImageFormatChange = (formats: { [key: string]: any }) => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;

    Object.keys(formats).forEach(formatName => {
        quill.format(formatName, formats[formatName], 'user');
    });

    setTimeout(() => {
        const range = quill.getSelection();
        if(range) (quill as any).emitter.emit('selection-change', range, range, 'user');
    }, 0);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setSelectedEntry(null);
    setEditingEntry(entry);
    setLeftSidebarVisible(false);
  };
  
  const handleNewEntry = () => {
    setSelectedEntry(null);
    setEditingEntry('new');
    setActiveView('timeline');
    setLeftSidebarVisible(false);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setLeftSidebarVisible(true);
  }

  const handleTriggerSave = () => {
    editorRef.current?.save();
  };

  if (keyStatus !== 'ready') {
    let content;
    switch (keyStatus) {
        case 'checking': content = <p>Initializing Secure Session...</p>; break;
        case 'needed': content = <InitializeEncryption onSuccess={handleKeyReady} session={session} />; break;
        case 'reauth': content = <PasswordPrompt onSuccess={handleKeyReady} session={session} />; break;
        default: content = <p>An unexpected error occurred.</p>;
    }
    return <main className="flex items-center justify-center h-screen">{content}</main>;
  }

  const renderMainView = () => {
    switch (activeView) {
      case 'calendar': return <CalendarView entries={entries} onSelectDate={handleDateSelect} onBack={() => setActiveView('timeline')} />;
      case 'search': return <SearchView entries={entries} onSelectEntry={(id) => handleEditEntry(entries.find(e => e.id === id)!)} onBack={() => setActiveView('timeline')} />;
      case 'profile': return (
        <ProfileView
            session={session}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onAvatarUpload={handleAvatarUpload}
            onExportData={handleExportData}
            onSignOut={handleSignOut}
            theme={theme}
            onToggleTheme={onToggleTheme}
        />
      );
      case 'timeline':
      default:
        if (selectedEntry) {
          return <DiaryEntryView 
                    entry={selectedEntry} 
                    onEdit={() => handleEditEntry(selectedEntry)}
                    onDelete={() => requestDeleteEntry(selectedEntry)}
                    onBack={handleBackToTimeline}
                  />
        }
        
        let entriesToShow = entries;
        
        if (selectedDate) {
             const dateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
             entriesToShow = entriesToShow.filter(e => {
                 const eDate = new Date(e.created_at);
                 const eDateStr = new Date(eDate.getTime() - (eDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                 return eDateStr === dateStr;
             });
        }
        
        if (activeJournal) {
            entriesToShow = entriesToShow.filter(e => (e.journal || 'Personal') === activeJournal);
        }

        return <DiaryList 
                  entries={entriesToShow} 
                  onThisDayEntries={onThisDayEntries} 
                  onSelectEntry={(id) => setSelectedEntry(entries.find(e => e.id === id) || null)} 
                  onLoadContent={loadEntryContent}
                  profile={profile}
                  filteredDate={selectedDate}
                  onClearFilter={() => setSelectedDate(null)}
               />;
    }
  };

  const changeView = (view: ViewState) => {
    setSelectedEntry(null);
    setEditingEntry(null);
    setSelectedDate(null);
    setActiveView(view);
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-[#FBF8F3] dark:bg-slate-900">
      <TopBar 
        isEditing={!!editingEntry}
        onSave={handleTriggerSave}
        onCancel={handleCancelEdit}
        currentDate={editingEntry && typeof editingEntry === 'object' ? new Date(editingEntry.created_at) : (selectedEntry ? new Date(selectedEntry.created_at) : new Date())}
        weather={weather}
        theme={theme}
        onToggleTheme={onToggleTheme}
        saveStatus={saveStatus}
        profile={profile}
        onShowProfile={() => changeView('profile')}
        isToolsPanelVisible={isToolsPanelVisible}
        onToggleToolsPanel={() => setToolsPanelVisible(p => !p)}
        isLeftSidebarVisible={isLeftSidebarVisible}
      />
      {!isLeftSidebarVisible && <HamburgerMenu onClick={() => setLeftSidebarVisible(true)} />}
      
      {isLeftSidebarVisible && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setLeftSidebarVisible(false)}
            aria-hidden="true"
          />
      )}

      <div className={`flex flex-1 overflow-hidden transition-all duration-300 ${isLeftSidebarVisible ? 'md:pl-64' : 'pl-0'} relative`}>
        <LeftSidebar 
          isVisible={isLeftSidebarVisible}
          onClose={() => setLeftSidebarVisible(false)}
          activeView={activeView}
          onChangeView={changeView}
          onNewEntry={handleNewEntry}
          journals={uniqueJournals}
          activeJournal={activeJournal}
          onSelectJournal={handleJournalSelect}
        />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0 w-full">
          {editingEntry ? (
            <DiaryEditor 
              ref={editorRef}
              key={(typeof editingEntry === 'object' && editingEntry.id) ? editingEntry.id : 'draft_session'}
              entry={typeof editingEntry === 'object' ? editingEntry : undefined}
              onSave={handleInitiateSave}
              onWordCountChange={setWordCount}
              onCharacterCountChange={setCharacterCount}
              editorFont={editorFont}
            />
          ) : loading ? (
             <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
                    <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm">Loading your encrypted diary...</p>
                </div>
            </div>
          ) : (
             renderMainView()
          )}
        </main>

        {editingEntry && isToolsPanelVisible && (
           <>
              <div 
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
                  onClick={() => setToolsPanelVisible(false)}
                  aria-hidden="true"
              />
              <div className="fixed inset-y-0 right-0 z-30 h-full w-64 shadow-2xl md:relative md:shadow-none md:z-auto animate-slide-in-right md:animate-none">
                <ToolsPanel 
                  entry={editingEntry}
                  onUpdateEntry={(updates) => {
                      if (editingEntry === 'new') {
                          setEditingEntry(prev => ({
                            id: '', owner_id: '', title: '', content: '',
                            created_at: new Date().toISOString(),
                            ...(typeof prev === 'object' ? prev : {}),
                            ...updates
                          }));
                      } else {
                          setEditingEntry(prev => ({ ...(prev as DiaryEntry), ...updates }));
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
           </>
        )}
      </div>
      {editingEntry && (
        <StatusBar 
          wordCount={wordCount}
          characterCount={characterCount}
          saveStatus={saveStatus} 
        />
      )}
      <ConfirmationModal
        isOpen={!!entryToDelete}
        isProcessing={isDeleting}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry?"
        message="Are you sure you want to permanently delete this entry? This action cannot be undone."
      />
      <SmartTagsModal 
        isOpen={isSmartTagsModalOpen}
        existingTags={pendingEntrySave?.tags || []}
        suggestedTags={smartSuggestions}
        onConfirm={handleConfirmSmartTags}
        onCancel={handleCancelSmartTags}
      />
    </div>
  );
};

export default DiaryApp;