import React, { useState, useMemo } from 'react';
import { usePersonalTasks } from '../../contexts/TaskContext';
import { useCrypto } from '../../contexts/CryptoContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskEditorModal } from '../../components/tasks/TaskEditorModal';
import { TaskExportModal } from '../../components/tasks/TaskExportModal';
import { TaskNotificationPrivacyModal } from '../../components/tasks/TaskNotificationPrivacyModal';
import { PersonalTask, DecryptedTaskPayload } from '../../types';
import { parseNaturalDate } from '../../lib/smartDateParser';
import { DEFAULT_TASK_CATEGORIES, formatTaskDueDate } from '../../lib/taskUtils';
import { taskAttachmentService } from '../../lib/taskAttachmentService';

export const TasksHub: React.FC = () => {
  const {
    tasks,
    loading,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    todayTasks,
    carriedForwardTasks,
    upcomingTasks,
    completedTasks,
  } = usePersonalTasks();
  const { key } = useCrypto();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'someday' | 'completed'>('today');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // In-Memory Client Search
  const searchFilteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.decrypted?.title?.toLowerCase().includes(q) ||
      t.decrypted?.notes?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  // Tasks without a due date (Someday / Later)
  const somedayTasks = useMemo(() => {
    return tasks.filter(t => !t.is_completed && !t.due_date);
  }, [tasks]);

  // Active today calculation
  const activeTodayCount = todayTasks.length + carriedForwardTasks.length;
  const todayDateStr = new Date().toDateString();
  const completedTodayCount = completedTasks.filter(
    t => t.completed_at && new Date(t.completed_at).toDateString() === todayDateStr
  ).length;
  const totalTodayCount = activeTodayCount + completedTodayCount;
  const progressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Real-time parsed date from quick input
  const quickParsed = useMemo(() => {
    if (!quickInput.trim()) return null;
    return parseNaturalDate(quickInput);
  }, [quickInput]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const parsed = parseNaturalDate(quickInput);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await createTask(
      { title: parsed.title || quickInput.trim() },
      {
        due_date: parsed.dueDate || todayStr,
        category_code: selectedCategory ?? 0,
        energy_level: 1,
        importance_level: 1,
      }
    );
    setQuickInput('');
  };

  const handleMoveToToday = async (task: PersonalTask) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await updateTask(task.id, task.decrypted!, {
      due_date: todayStr,
      category_code: task.category_code,
      energy_level: task.energy_level,
      importance_level: task.importance_level,
      entry_id: task.entry_id,
    });
  };

  const handleOpenEdit = (task: PersonalTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (
    payload: DecryptedTaskPayload,
    meta: {
      due_date?: string | null;
      category_code: number;
      energy_level: 1 | 2 | 3;
      importance_level: 1 | 2 | 3;
      entry_id?: string | null;
    },
    stagedFiles?: File[]
  ) => {
    if (editingTask) {
      await updateTask(editingTask.id, payload, meta);
    } else {
      const created = await createTask(payload, meta);
      if (created && stagedFiles && stagedFiles.length > 0 && key) {
        for (const file of stagedFiles) {
          try {
            await taskAttachmentService.uploadAttachment(key, created.owner_id, created.id, file);
          } catch (err) {
            console.error('Failed to upload staged file:', err);
          }
        }
      }
    }
  };

  // Filter tasks by selected category
  const filterByCategory = (list: PersonalTask[]) => {
    if (selectedCategory === null) return list;
    return list.filter(t => t.category_code === selectedCategory);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/60 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 font-sans">
              My Tasks
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
            Private, encrypted to-dos and reminders alongside your diary.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search tasks"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/70 dark:border-indigo-700 dark:text-indigo-300'
                : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            title="Export tasks as Markdown, CSV, or JSON"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>📤</span>
            <span>Export</span>
          </button>

          {/* Privacy Settings */}
          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            title="Notification privacy settings"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>🛡️</span>
            <span>Privacy</span>
          </button>

          {/* New Task Button */}
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Daily Progress Bar Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-emerald-50/50 to-stone-50/80 dark:from-zinc-900/90 dark:via-zinc-800/80 dark:to-zinc-900/90 border border-stone-200/80 dark:border-zinc-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
            {progressPercent}%
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-zinc-100">
              {totalTodayCount > 0
                ? activeTodayCount === 0
                  ? "All caught up for today! 🎉"
                  : `${completedTodayCount} of ${totalTodayCount} tasks completed`
                : "No tasks scheduled for today"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              {activeTodayCount > 0
                ? `${activeTodayCount} pending to-do item${activeTodayCount === 1 ? '' : 's'}`
                : "Add to-dos below or take a moment to write in your journal."}
            </p>
          </div>
        </div>

        {totalTodayCount > 0 && (
          <div className="w-full sm:w-48 bg-stone-200/70 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden self-center">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Search Bar (Collapsible or active) */}
      {(isSearchOpen || searchQuery) && (
        <div className="relative animate-fade-in">
          <input
            type="text"
            autoFocus
            placeholder="Search tasks by keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-stone-800 dark:text-zinc-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs transition-all"
          />
          <svg className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Streamlined Quick-Add Input with Live Date Feedback Chips */}
      <div className="relative">
        <form onSubmit={handleQuickAdd} className="relative">
          <input
            type="text"
            placeholder="Add a task... (e.g. 'Call mom tomorrow' or 'Doctor on Friday at 3pm')"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            className="w-full pl-11 pr-24 py-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs sm:text-sm transition-all"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-0 transition-all cursor-pointer shadow-2xs"
          >
            Add Task
          </button>
        </form>

        {/* Dynamic Natural Language Date Confirmation Chips */}
        {quickParsed && (quickParsed.dueDate || quickParsed.title) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1 text-xs animate-fade-in">
            <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium">Smart Detection:</span>
            {quickParsed.dueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/40">
                <span>📅</span>
                <span>{formatTaskDueDate(quickParsed.dueDate).text}</span>
              </span>
            )}
            {quickParsed.title && quickParsed.title !== quickInput.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 truncate max-w-[200px]">
                <span>Task:</span>
                <span className="truncate font-medium">{quickParsed.title}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 dark:bg-zinc-800/60 rounded-xl overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Today</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-[10px] font-semibold">
            {todayTasks.length + carriedForwardTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Upcoming</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 dark:bg-zinc-700 text-[10px] font-semibold">
            {upcomingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('someday')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'someday'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Someday / Later</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 dark:bg-zinc-700 text-[10px] font-semibold">
            {somedayTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Completed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-[10px] font-semibold">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full border transition-all cursor-pointer flex-shrink-0 font-medium ${
            selectedCategory === null
              ? 'bg-stone-800 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs font-semibold'
              : 'bg-white dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-stone-300'
          }`}
        >
          All Categories
        </button>
        {Object.values(DEFAULT_TASK_CATEGORIES).map(cat => (
          <button
            key={cat.code}
            type="button"
            onClick={() => setSelectedCategory(selectedCategory === cat.code ? null : cat.code)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer flex-shrink-0 font-medium ${
              selectedCategory === cat.code
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                : 'bg-white dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-stone-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Tasks List Renderings */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-stone-400 dark:text-zinc-500 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Decrypting private tasks...</p>
        </div>
      ) : searchFilteredTasks !== null ? (
        /* Search Results View */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Found {searchFilteredTasks.length} task{searchFilteredTasks.length === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;:
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>
          {searchFilteredTasks.length > 0 ? (
            <div className="space-y-2">
              {filterByCategory(searchFilteredTasks).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onEdit={handleOpenEdit}
                  onDelete={deleteTask}
                  onMoveToToday={handleMoveToToday}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                No tasks match &ldquo;{searchQuery}&rdquo;. Try another keyword.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Regular Tabbed Views */
        <div className="space-y-5">
          {/* Today View */}
          {activeTab === 'today' && (
            <>
              {/* Carried Over Section */}
              {carriedForwardTasks.length > 0 && filterByCategory(carriedForwardTasks).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-amber-800 dark:text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>Carried Over from Earlier</span>
                    </div>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-normal">
                      Tap "Today" to move to your current focus
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filterByCategory(carriedForwardTasks).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={handleOpenEdit}
                        onDelete={deleteTask}
                        onMoveToToday={handleMoveToToday}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Focus Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  <span>🎯</span>
                  <span>Today's Tasks</span>
                </div>
                {filterByCategory(todayTasks).length > 0 ? (
                  <div className="space-y-2">
                    {filterByCategory(todayTasks).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={handleOpenEdit}
                        onDelete={deleteTask}
                        onMoveToToday={handleMoveToToday}
                      />
                    ))}
                  </div>
                ) : (
                  carriedForwardTasks.length === 0 && (
                    <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                      <p className="text-3xl mb-2">🌸</p>
                      <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200">
                        You're All Caught Up!
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        No pending tasks for today. Add a new task above or enjoy some time to reflect.
                      </p>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Upcoming View */}
          {activeTab === 'upcoming' && (
            <div className="space-y-2">
              {filterByCategory(upcomingTasks).length > 0 ? (
                filterByCategory(upcomingTasks).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={handleOpenEdit}
                    onDelete={deleteTask}
                    onMoveToToday={handleMoveToToday}
                  />
                ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">📅</p>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200">
                    No Upcoming Tasks
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    Schedule tasks with future due dates to see them organized here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Someday / Later View */}
          {activeTab === 'someday' && (
            <div className="space-y-2">
              {filterByCategory(somedayTasks).length > 0 ? (
                filterByCategory(somedayTasks).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={handleOpenEdit}
                    onDelete={deleteTask}
                    onMoveToToday={handleMoveToToday}
                  />
                ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">💡</p>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200">
                    No Someday Tasks
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    Store backlogged ideas, books to read, or tasks without a set date here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completed View */}
          {activeTab === 'completed' && (
            <div className="space-y-2">
              {filterByCategory(completedTasks).length > 0 ? (
                filterByCategory(completedTasks).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={handleOpenEdit}
                    onDelete={deleteTask}
                    onMoveToToday={handleMoveToToday}
                  />
                ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">✨</p>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200">
                    No Completed Tasks Yet
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                    When you check off a task, it will be listed here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Editor Modal / Bottom Sheet */}
      <TaskEditorModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
      />

      {/* Export Modal */}
      <TaskExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tasks={tasks}
      />

      {/* Privacy Modal */}
      <TaskNotificationPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default TasksHub;
