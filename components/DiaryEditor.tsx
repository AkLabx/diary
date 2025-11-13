import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DiaryEntry } from '../types';
import ReactQuill from 'react-quill';

interface DiaryEditorProps {
  entry?: DiaryEntry;
  onSave: (entryData: Omit<DiaryEntry, 'id' | 'owner_id' | 'created_at'> & { created_at: string }, id?: string) => void;
  onCancel: () => void;
}

const moods = ['😊', '😢', '😠', '😎', '🤔', '😍', '😴', '🥳'];
const MAX_CHARS = 10000;

const DatePickerPopup: React.FC<{
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}> = ({ currentDate, onSelectDate, onClose }) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const changeMonth = (amount: number) => {
    setDisplayDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const renderCells = () => {
    const monthStart = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const cells = [];
    let day = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const cloneDay = new Date(day);
      const isSelected = cloneDay.toDateString() === currentDate.toDateString();
      const isCurrentMonth = cloneDay.getMonth() === displayDate.getMonth();
      
      cells.push(
        <div
          key={day.toISOString()}
          className={`flex items-center justify-center h-8 w-8 rounded-full text-sm cursor-pointer transition-colors ${
            isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
          } ${
            isSelected ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          onClick={() => onSelectDate(cloneDay)}
        >
          {cloneDay.getDate()}
        </div>
      );
      day.setDate(day.getDate() + 1);
    }
    return cells;
  };

  return (
    <div ref={popupRef} className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 w-64">
       <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">Calendar</div>
        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderCells()}</div>
    </div>
  );
};


const DiaryEditor: React.FC<DiaryEditorProps> = ({ entry, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());

  const [showMoods, setShowMoods] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setTags(entry.tags?.join(', ') || '');
      setEntryDate(new Date(entry.created_at));
    }
  }, [entry]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const isContentEmpty = !content || content.replace(/<(.|\n)*?>/g, '').trim().length === 0;

    if (title.trim() === '' || isContentEmpty) {
      alert('Please fill out both title and content.');
      return;
    }

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({ title, content, mood, tags: tagsArray, created_at: entryDate.toISOString() }, entry?.id);
  };

  const handleContentChange = (value: string) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const text = editor.getText();
      if (text.length > MAX_CHARS + 1) {
         const limitedContent = editor.getContents(0, MAX_CHARS);
         editor.setContents(limitedContent, 'silent');
         setContent(editor.root.innerHTML);
      } else {
        setContent(value);
      }
    }
  };

  const contentLength = useMemo(() => {
    return content.replace(/<(.|\n)*?>/g, '').trim().length;
  }, [content]);

  const modules = useMemo(() => ({
    toolbar: {
      container: '#toolbar-container',
    }
  }), []);

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl flex flex-col max-h-[95vh]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{entry ? 'Edit Entry' : 'New Entry'}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="font-semibold text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Save Entry
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-4 relative">
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-grow w-full px-1 py-2 text-xl font-semibold border-0 border-b-2 border-slate-200 dark:border-slate-600 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-500 bg-transparent dark:text-slate-100 dark:placeholder-slate-400"
            placeholder="My Wonderful Adventure"
            required
          />
          <button type="button" onClick={() => { setShowMoods(p => !p); setShowTags(false); }} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">
            {mood ? <span className="text-lg">{mood}</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.5.5 0 01.708 0 5 5 0 01-6.488 0 .5.5 0 01.708-.707A4 4 0 0013 12.5a.5.5 0 01.535.464z" clipRule="evenodd" /></svg>}
            <span>Mood</span>
          </button>
           <button type="button" onClick={() => { setShowTags(p => !p); setShowMoods(false); }} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5a.997.997 0 01.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            <span>Tags</span>
          </button>

          {showMoods && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 shadow-lg rounded-lg border dark:border-slate-700 p-2 grid grid-cols-4 gap-2 w-64 z-10">
              {moods.map(m => (
                <button key={m} type="button" onClick={() => { setMood(m === mood ? undefined : m); setShowMoods(false); }} className={`text-3xl p-2 rounded-md transition-all ${mood === m ? 'bg-indigo-100 dark:bg-indigo-500/50 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{m}</button>
              ))}
            </div>
          )}
          {showTags && (
             <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 shadow-lg rounded-lg border dark:border-slate-700 p-3 w-64 z-10 space-y-2">
                <label htmlFor="tags-input" className="text-sm font-medium text-slate-700 dark:text-slate-200">Tags</label>
                <input id="tags-input" type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="work, travel..."/>
                <p className="text-xs text-slate-500 dark:text-slate-400">Separate with commas.</p>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <div id="toolbar-container" className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-600 relative">
                <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50" aria-label="Add image" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                </button>
                <button className="ql-bold p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600" />
                <button className="ql-italic p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600" />
                <button className="ql-underline p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600" />
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1"></div>
                <button className="ql-list p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600" value="ordered" />
                <button className="ql-list p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600" value="bullet" />
                <select className="ql-header p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600 bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 w-8" defaultValue="">
                  <option value="1">H1</option>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="">Normal</option>
                </select>
                <div className="flex-grow"></div>
                 <button 
                  onClick={() => setShowCalendar(p => !p)}
                  disabled={!!entry}
                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label="Change entry date"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 dark:text-slate-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                 </button>
                 {showCalendar && !entry && (
                   <DatePickerPopup 
                     currentDate={entryDate} 
                     onSelectDate={(date) => {
                       setEntryDate(date);
                       setShowCalendar(false);
                     }}
                     onClose={() => setShowCalendar(false)}
                   />
                 )}
            </div>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={handleContentChange}
                className="prose-editor"
                placeholder="Today was an amazing day..."
                modules={modules}
            />
        </div>
      </div>
      
      <div className="text-right text-sm text-slate-500 dark:text-slate-400 p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <span>{contentLength}/{MAX_CHARS} characters</span>
      </div>
    </div>
  );
};

export default DiaryEditor;