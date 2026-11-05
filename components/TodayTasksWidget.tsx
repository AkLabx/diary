import React, { useState } from 'react';
import { usePersonalTasks } from '../contexts/TaskContext';
import { Link } from 'react-router-dom';
import { parseNaturalDate } from '../lib/smartDateParser';
import { getCategoryMeta } from '../lib/taskUtils';

export const TodayTasksWidget: React.FC = () => {
  const { todayTasks, carriedForwardTasks, toggleTask, createTask } = usePersonalTasks();
  const [quickText, setQuickText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeIntentions = [...carriedForwardTasks, ...todayTasks];
  const totalIntentions = activeIntentions.length;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    const parsed = parseNaturalDate(quickText);
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await createTask(
      { title: parsed.title || quickText.trim() },
      {
        due_date: parsed.dueDate || defaultDate,
        category_code: 0,
        energy_level: 1,
        importance_level: 2,
      }
    );
    setQuickText('');
  };

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-stone-50/50 dark:from-slate-800/80 dark:via-indigo-950/20 dark:to-slate-800/60 p-4 shadow-sm backdrop-blur-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-serif">
            Today's Intentions
          </h3>
          {totalIntentions > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
              {totalIntentions} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            to="/app/tasks"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Tasks Hub</span>
            <span>&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label={isCollapsed ? 'Expand intentions widget' : 'Collapse intentions widget'}
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Body */}
      {!isCollapsed && (
        <div className="mt-2 space-y-3">
          {/* Active List */}
          {activeIntentions.length > 0 ? (
            <div className="space-y-1.5">
              {activeIntentions.slice(0, 3).map(task => {
                const category = getCategoryMeta(task.category_code);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="w-4 h-4 rounded-full border border-stone-300 dark:border-zinc-600 hover:border-indigo-500 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                        aria-label="Mark completed"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {task.decrypted?.title || '🔒 Encrypted Intention'}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      {category.icon} {category.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}

              {activeIntentions.length > 3 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
                  +{activeIntentions.length - 3} more intentions in{' '}
                  <Link to="/app/tasks" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                    Tasks Hub
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Your day is clear and calm. Capture a gentle intention below:
            </p>
          )}

          {/* Quick-Capture Input */}
          <form onSubmit={handleQuickAdd} className="relative mt-2">
            <input
              type="text"
              placeholder="e.g. Call sister tonight, walk in nature tomorrow..."
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs"
            />
            <button
              type="submit"
              disabled={!quickText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 disabled:opacity-0 transition-all cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TodayTasksWidget;
