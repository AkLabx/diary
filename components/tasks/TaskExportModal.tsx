import React, { useEffect, useId, useRef, useState } from 'react';
import { PersonalTask } from '../../types';
import { taskExport } from '../../lib/taskExport';

interface TaskExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PersonalTask[];
}

export const TaskExportModal: React.FC<TaskExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingProgrammaticallyRef = useRef(false);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      closingProgrammaticallyRef.current = true;
      dialog.close();
    }
  }, [isOpen]);

  const handleExport = (format: 'md' | 'csv' | 'json') => {
    setDownloadingFormat(format);
    try {
      if (format === 'md') taskExport.exportMarkdown(tasks);
      else if (format === 'csv') taskExport.exportCSV(tasks);
      else if (format === 'json') taskExport.exportJSON(tasks);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 500);
    }
  };

  const handleClose = () => {
    if (closingProgrammaticallyRef.current) {
      closingProgrammaticallyRef.current = false;
      return;
    }
    onClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || e.target !== dialog) {
      pressedOutsideRef.current = false;
      return;
    }
    const rect = dialog.getBoundingClientRect();
    pressedOutsideRef.current =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || !pressedOutsideRef.current || e.target !== dialog) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = false;
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const rect = dialog.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      onClose();
    }
  };

  const activeCount = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-transparent p-0 border-0 text-inherit backdrop:bg-stone-900/50 backdrop:backdrop-blur-sm"
    >
      {isOpen && (
      <div className="relative w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 p-6 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📤</span>
            <h3 id={titleId} className="text-lg font-semibold text-stone-800 dark:text-zinc-100">
              Export Tasks
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-3">
          Download your decrypted tasks in your preferred format. All exports are generated entirely on your device with 0 server transmission.
        </p>

        <div className="my-3 px-3 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 flex items-center justify-between text-xs text-stone-600 dark:text-zinc-300">
          <span>Active: <strong>{activeCount}</strong></span>
          <span>Completed: <strong>{completedCount}</strong></span>
          <span>Total: <strong>{tasks.length}</strong></span>
        </div>

        {/* Export Formats */}
        <div className="space-y-3 mt-4">
          {/* Markdown */}
          <button
            type="button"
            onClick={() => handleExport('md')}
            disabled={downloadingFormat !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60">📄</span>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Markdown (.md)
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Formatted with checkboxes for Obsidian, Notion, or local archives.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              {downloadingFormat === 'md' ? 'Saving...' : 'Download'}
            </span>
          </button>

          {/* CSV Spreadsheet */}
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={downloadingFormat !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60">📊</span>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Spreadsheet (.csv)
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Tabular data for Excel, Apple Numbers, or Google Sheets.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {downloadingFormat === 'csv' ? 'Saving...' : 'Download'}
            </span>
          </button>

          {/* JSON Vault */}
          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={downloadingFormat !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60">📦</span>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Full Vault (.json)
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Complete structured backup with all metadata and subtasks.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {downloadingFormat === 'json' ? 'Saving...' : 'Download'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      )}
    </dialog>
  );
};
