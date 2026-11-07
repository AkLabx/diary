import React, { useState } from 'react';
import { usePersonalTasks } from '../contexts/TaskContext';
import { Link } from 'react-router-dom';
import { parseNaturalDate } from '../lib/smartDateParser';
import { getCategoryMeta } from '../lib/taskUtils';

export const TodayTasksWidget: React.FC = () => {
  const { todayTasks, carriedForwardTasks, completedTasks, toggleTask, createTask } = usePersonalTasks();
  const [quickText, setQuickText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTasks = [...carriedForwardTasks, ...todayTasks];
  const totalActive = activeTasks.length;
  
  // Tasks completed today
  const todayStr = new Date().toDateString();
  const completedToday = completedTasks.filter(t => t.completed_at && new Date(t.completed_at).toDateString() === todayStr);
  const totalTodayTasks = totalActive + completedToday.length;

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
        importance_level: 1,
      }
    );
    setQuickText('');
  };

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3.5 sm:p-4 shadow-xs backdrop-blur-md transition-all">
      {/* Compact Focus Strip Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-sans truncate">
                Today's Tasks
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {totalTodayTasks > 0 ? (
                  totalActive === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">All done! 🎉</span>
                  ) : (
                    <span>{completedToday.length} of {totalTodayTasks} done</span>
                  )
                ) : (
                  <span>No tasks scheduled</span>
                )}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/app/tasks"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hidden sm:inline-flex items-center gap-1 transition-colors"
          >
            <span>All Tasks</span>
            <span>&rarr;</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label={isExpanded ? 'Collapse tasks strip' : 'Expand tasks strip'}
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Task List & Quick Add */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-fade-in">
          {/* Active Tasks List */}
          {activeTasks.length > 0 ? (
            <div className="space-y-1.5">
              {activeTasks.slice(0, 4).map(task => {
                const category = getCategoryMeta(task.category_code);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                        aria-label="Mark task done"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {task.decrypted?.title || '🔒 Private Task'}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md border flex-shrink-0 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      {category.icon} {category.label}
                    </span>
                  </div>
                );
              })}

              {activeTasks.length > 4 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                  +{activeTasks.length - 4} more tasks in{' '}
                  <Link to="/app/tasks" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">
                    Tasks
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-1">
              You're all caught up for today! Add a task below if anything comes up:
            </p>
          )}

          {/* Quick-Capture Form */}
          <form onSubmit={handleQuickAdd} className="relative pt-1">
            <input
              type="text"
              placeholder="Add a task for today... (e.g. 'Call doctor at 2pm')"
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!quickText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 mt-0.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 disabled:opacity-0 transition-all cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="flex justify-end pt-1">
            <Link
              to="/app/tasks"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Open Full Tasks View &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayTasksWidget;
