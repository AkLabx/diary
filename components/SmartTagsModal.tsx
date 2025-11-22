
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface SmartTagsModalProps {
  isOpen: boolean;
  existingTags: string[];
  suggestedTags: string[];
  onConfirm: (finalTags: string[]) => void;
  onCancel: () => void;
}

const SmartTagsModal: React.FC<SmartTagsModalProps> = ({ isOpen, existingTags, suggestedTags, onConfirm, onCancel }) => {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Merge and deduplicate
      const unique = Array.from(new Set([...existingTags, ...suggestedTags]));
      setTags(unique);
    }
  }, [isOpen, existingTags, suggestedTags]);

  if (!isOpen) return null;

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
             <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Smart Tags
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    We found some keywords in your entry. Review them before saving.
                </p>
             </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 min-h-[100px] border border-slate-100 dark:border-slate-700">
            {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                    // Highlight newly suggested tags that weren't in existing tags
                    const isNew = !existingTags.includes(tag);
                    return (
                        <span 
                            key={tag} 
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors group ${
                                isNew 
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800' 
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-transparent'
                            }`}
                        >
                            {tag}
                            <button 
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-500 dark:hover:text-red-400 focus:outline-none opacity-60 group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove tag ${tag}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </span>
                    );
                })}
                </div>
            ) : (
                <p className="text-sm text-slate-400 italic text-center mt-4">No tags selected.</p>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800 flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold mb-1">Privacy Check:</p>
                <p>1. Analysis happens <strong>offline</strong> on your device.</p>
                <p>2. Tags are saved as <strong>unencrypted metadata</strong> (for search).</p>
                <p>3. Your diary body remains <strong>fully encrypted</strong>.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Save without suggestions
          </button>
          <button
            onClick={() => onConfirm(tags)}
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-all transform active:scale-95"
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default SmartTagsModal;
