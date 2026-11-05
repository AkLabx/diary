import React, { useState, useEffect, useRef } from 'react';
import { PersonalTask, DecryptedTaskPayload } from '../../types';
import { DEFAULT_TASK_CATEGORIES, ENERGY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/taskUtils';
import { RECURRENCE_OPTIONS, RecurrenceFrequency } from '../../lib/recurrenceEngine';
import { taskAttachmentService, DecryptedAttachment } from '../../lib/taskAttachmentService';
import { useCrypto } from '../../contexts/CryptoContext';
import { useToast } from '../../contexts/ToastContext';

interface TaskEditorModalProps {
  isOpen: boolean;
  taskToEdit?: PersonalTask | null;
  onClose: () => void;
  onSave: (
    payload: DecryptedTaskPayload,
    meta: {
      due_date?: string | null;
      category_code: number;
      energy_level: 1 | 2 | 3;
      importance_level: 1 | 2 | 3;
      entry_id?: string | null;
    }
  ) => Promise<void>;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  isOpen,
  taskToEdit,
  onClose,
  onSave,
}) => {
  const { key } = useCrypto();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [categoryCode, setCategoryCode] = useState<number>(0);
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3>(1);
  const [importanceLevel, setImportanceLevel] = useState<1 | 2 | 3>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<DecryptedAttachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.decrypted?.title || '');
      setNotes(taskToEdit.decrypted?.notes || '');
      setDueDate(taskToEdit.due_date || '');
      setRecurrence((taskToEdit.decrypted?.recurrence as RecurrenceFrequency) || 'none');
      setReminderTime(taskToEdit.decrypted?.reminderTime || '');
      setCategoryCode(taskToEdit.category_code ?? 0);
      setEnergyLevel(taskToEdit.energy_level ?? 1);
      setImportanceLevel(taskToEdit.importance_level ?? 2);

      // Load attachments for existing task
      if (key) {
        setIsLoadingAttachments(true);
        taskAttachmentService
          .fetchAttachments(key, taskToEdit.id)
          .then(list => setAttachments(list))
          .catch(err => console.warn('Could not load task attachments:', err))
          .finally(() => setIsLoadingAttachments(false));
      }
    } else {
      // Default new intention
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setTitle('');
      setNotes('');
      setDueDate(dateStr);
      setRecurrence('none');
      setReminderTime('');
      setCategoryCode(0);
      setEnergyLevel(1);
      setImportanceLevel(2);
      setAttachments([]);
    }
  }, [taskToEdit, isOpen, key]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          title: title.trim(),
          notes: notes.trim() || undefined,
          recurrence: recurrence !== 'none' ? recurrence : undefined,
          reminderTime: reminderTime.trim() || undefined,
        },
        {
          due_date: dueDate || null,
          category_code: categoryCode,
          energy_level: energyLevel,
          importance_level: importanceLevel,
        }
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickDate = (type: 'today' | 'tomorrow' | 'someday') => {
    const d = new Date();
    if (type === 'today') {
      setDueDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      setDueDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      setDueDate('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !key || !taskToEdit) {
      if (!taskToEdit) {
        addToast('Please save the intention first before attaching files.', 'info');
      }
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const uploaded = await taskAttachmentService.uploadAttachment(
        key,
        taskToEdit.owner_id,
        taskToEdit.id,
        file
      );
      setAttachments(prev => [...prev, uploaded]);
      addToast('Encrypted attachment uploaded', 'success');
    } catch (err) {
      console.error('Attachment upload failed:', err);
      addToast('Failed to upload encrypted file', 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      await taskAttachmentService.deleteAttachment(attachmentId, filePath);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      addToast('Attachment removed', 'info');
    } catch (err) {
      console.error('Delete attachment error:', err);
      addToast('Failed to delete attachment', 'error');
    }
  };

  const handleOpenAttachment = async (att: DecryptedAttachment) => {
    if (!key) return;
    try {
      const url = await taskAttachmentService.getDecryptedBlobUrl(key, att.filePath, att.iv, att.fileType);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error opening attachment:', err);
      addToast('Could not decrypt attachment', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h3 className="text-lg font-semibold text-stone-800 dark:text-zinc-100">
              {taskToEdit ? 'Edit Personal Intention' : 'New Personal Intention'}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Intention or Task
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Schedule health checkup, write thank you note..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Private Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Intimate reflections, phone numbers, or context..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Schedule Date & Quick Select */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider">
                Schedule Date
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('tomorrow')}
                  className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('someday')}
                  className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors"
                >
                  Someday
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50 text-stone-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Recurrence & Reminder Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Recurrence */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Repeat Pattern
              </label>
              <select
                value={recurrence}
                onChange={e => setRecurrence(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50 text-stone-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                {RECURRENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Time */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Reminder Time (Optional)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/50 text-stone-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Sanctuary Realm
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(DEFAULT_TASK_CATEGORIES).map(cat => (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => setCategoryCode(cat.code)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left cursor-pointer ${
                    categoryCode === cat.code
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:border-stone-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy & Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Energy */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Energy Level
              </label>
              <div className="flex gap-1.5">
                {ENERGY_LEVELS.map(lvl => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setEnergyLevel(lvl.value as 1 | 2 | 3)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      energyLevel === lvl.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    {lvl.icon} {lvl.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Importance
              </label>
              <div className="flex gap-1.5">
                {IMPORTANCE_LEVELS.map(lvl => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setImportanceLevel(lvl.value as 1 | 2 | 3)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      importanceLevel === lvl.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    {lvl.icon} {lvl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Encrypted Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📎</span>
                <span>Encrypted Attachments</span>
              </label>
              {taskToEdit && (
                <button
                  type="button"
                  disabled={isUploadingAttachment}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer"
                >
                  {isUploadingAttachment ? 'Securing...' : '+ Attach File'}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />

            {!taskToEdit ? (
              <p className="text-xs text-stone-400 dark:text-zinc-500 italic">
                Save this intention first to attach prescription photos, receipts, or documents.
              </p>
            ) : isLoadingAttachments ? (
              <p className="text-xs text-stone-400 dark:text-zinc-500">Loading attachments...</p>
            ) : attachments.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border border-dashed border-stone-200 dark:border-zinc-800 rounded-xl text-center text-xs text-stone-500 dark:text-zinc-400 cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                Click to attach private photos or documents (AES-GCM encrypted)
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-800 text-xs"
                  >
                    <div
                      onClick={() => handleOpenAttachment(att)}
                      className="flex items-center gap-2 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <span>📄</span>
                      <span className="truncate font-medium text-stone-700 dark:text-zinc-200">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                        ({Math.round(att.size / 1024)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.id, att.filePath)}
                      className="p-1 text-stone-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Remove attachment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* E2EE Security Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100/70 dark:bg-zinc-800/50 text-[11px] text-stone-500 dark:text-zinc-400">
            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span>Title, notes, and file attachments are client-side AES-GCM encrypted before upload.</span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Securing...' : taskToEdit ? 'Save Changes' : 'Create Intention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
