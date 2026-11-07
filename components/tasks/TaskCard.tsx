import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PersonalTask } from '../../types';
import { getCategoryMeta, formatTaskDueDate, ENERGY_LEVELS, IMPORTANCE_LEVELS } from '../../lib/taskUtils';
import { formatRecurrenceLabel } from '../../lib/recurrenceEngine';

interface TaskCardProps {
  task: PersonalTask;
  onToggle: (id: string) => void;
  onEdit: (task: PersonalTask) => void;
  onDelete: (id: string) => void;
  onMoveToToday?: (task: PersonalTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete,
  onMoveToToday 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const category = getCategoryMeta(task.category_code);
  const due = formatTaskDueDate(task.due_date);
  const energy = ENERGY_LEVELS.find(e => e.value === task.energy_level);
  const importance = IMPORTANCE_LEVELS.find(i => i.value === task.importance_level);
  const recurrenceLabel = task.decrypted?.recurrence && task.decrypted.recurrence !== 'none'
    ? formatRecurrenceLabel(task.decrypted.recurrence)
    : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl transition-all duration-200 border ${
        task.is_completed
          ? 'bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/50 opacity-70'
          : due.isOverdue
          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50 shadow-2xs'
          : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* 44x44px Accessible Hit Area for Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.is_completed ? `Mark "${task.decrypted?.title || 'task'}" incomplete` : `Mark "${task.decrypted?.title || 'task'}" done`}
        className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
            task.is_completed
              ? 'bg-emerald-600 border-emerald-600 text-white scale-100 shadow-xs'
              : 'border-slate-300 dark:border-zinc-600 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30'
          }`}
        >
          {task.is_completed && (
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm sm:text-base font-medium transition-colors ${
              task.is_completed
                ? 'line-through text-slate-400 dark:text-zinc-500'
                : 'text-slate-800 dark:text-zinc-100'
            }`}
          >
            {task.decrypted?.title || '🔒 Private Task'}
          </p>

          {/* Action buttons */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-90 sm:opacity-0 sm:group-hover:opacity-100'}`}>
            {due.isOverdue && !task.is_completed && onMoveToToday && (
              <button
                type="button"
                onClick={() => onMoveToToday(task)}
                title="Move task to Today"
                className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              title="Edit task"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
              title="Delete task"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notes preview if any */}
        {task.decrypted?.notes && (
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {task.decrypted.notes}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {/* Category Pill */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${category.colorClass}`}>
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </span>

          {/* Due Date Indicator */}
          {task.due_date && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                due.isOverdue
                  ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-semibold'
                  : due.isToday
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                  : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{due.text}</span>
            </span>
          )}

          {/* Link to Parent Diary Entry */}
          {task.entry_id && (
            <Link
              to={`/app/entry/${task.entry_id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 transition-colors"
              title="View linked journal reflection"
            >
              <span>📖</span>
              <span>Linked Entry</span>
            </Link>
          )}

          {/* Repeat Pattern */}
          {recurrenceLabel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <span>{recurrenceLabel}</span>
            </span>
          )}

          {/* Reminder Time */}
          {task.decrypted?.reminderTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
              <span>⏰</span>
              <span>{task.decrypted.reminderTime}</span>
            </span>
          )}

          {/* Importance */}
          {importance && importance.value !== 1 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              <span>{importance.icon}</span>
              <span>{importance.label}</span>
            </span>
          )}

          {/* Energy */}
          {energy && energy.value !== 1 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
              <span>{energy.icon}</span>
              <span>{energy.label}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
