import React, { useState, useMemo } from 'react';
import { usePersonalTasks } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskEditorModal } from '../../components/tasks/TaskEditorModal';
import { PersonalTask, DecryptedTaskPayload } from '../../types';
import { parseNaturalDate } from '../../lib/smartDateParser';

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

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all' | 'completed'>('today');
  const [quickInput, setQuickInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Zero-Knowledge In-Memory Client Search
  const searchFilteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t =>
      t.decrypted?.title?.toLowerCase().includes(q) ||
      t.decrypted?.notes?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

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
        category_code: 0,
        energy_level: 1,
        importance_level: 2,
      }
    );
    setQuickInput('');
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
    }
  ) => {
    if (editingTask) {
      await updateTask(editingTask.id, payload, meta);
    } else {
      await createTask(payload, meta);
    }
  };

  const totalActive = todayTasks.length + carriedForwardTasks.length + upcomingTasks.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/60 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 font-serif">
              Personal Intentions
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
            End-to-end encrypted life commitments alongside your private reflections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Intention</span>
        </button>
      </div>

      {/* Quick Add Bar with Natural Language Support */}
      <form onSubmit={handleQuickAdd} className="relative">
        <input
          type="text"
          placeholder="Add a gentle intention... (e.g. 'Call sister tomorrow' or 'Doctor on Friday')"
          value={quickInput}
          onChange={e => setQuickInput(e.target.value)}
          className="w-full pl-11 pr-24 py-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-stone-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm backdrop-blur-sm transition-all"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <button
          type="submit"
          disabled={!quickInput.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-0 transition-all cursor-pointer"
        >
          Save
        </button>
      </form>

      {/* In-Memory Zero-Knowledge Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search encrypted intentions by keyword..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-xs text-stone-800 dark:text-zinc-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
        <svg className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 dark:bg-zinc-800/60 rounded-xl overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'today'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Today</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-[10px]">
            {todayTasks.length + carriedForwardTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Upcoming & Someday</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 dark:bg-zinc-700 text-[10px]">
            {upcomingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>All Active</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 dark:bg-zinc-700 text-[10px]">
            {totalActive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
          }`}
        >
          <span>Accomplished</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-[10px]">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {/* Task List Renderings */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-stone-400 dark:text-zinc-500 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Decrypting private intentions...</p>
        </div>
      ) : searchFilteredTasks !== null ? (
        /* Search Results View */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Found {searchFilteredTasks.length} search results for &ldquo;{searchQuery}&rdquo;:
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
              {searchFilteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onEdit={handleOpenEdit}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                No intentions match &ldquo;{searchQuery}&rdquo;. Try another keyword.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Regular Tabbed Views */
        <div className="space-y-6">
          {/* Today View */}
          {activeTab === 'today' && (
            <>
              {/* Carried Forward Group */}
              {carriedForwardTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <span>⏳</span>
                    <span>Carried Forward (Gentle Rollover)</span>
                  </div>
                  <div className="space-y-2">
                    {carriedForwardTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={handleOpenEdit}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Focus */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-stone-600 dark:text-zinc-400">
                  <span>🎯</span>
                  <span>Today's Focus</span>
                </div>
                {todayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onEdit={handleOpenEdit}
                        onDelete={deleteTask}
                      />
                    ))}
                  </div>
                ) : (
                  carriedForwardTasks.length === 0 && (
                    <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                      <p className="text-3xl mb-2">🌸</p>
                      <h4 className="text-sm font-semibold text-stone-800 dark:text-zinc-200 font-serif">
                        Your Day is Clear and Serene
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        No pending intentions for today. Take a mindful breath, write in your journal, or add a gentle goal.
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
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={handleOpenEdit}
                    onDelete={deleteTask}
                  />
                ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">🌱</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    No upcoming intentions scheduled. Add dates when you wish to be gently reminded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* All Active View */}
          {activeTab === 'all' && (
            <div className="space-y-2">
              {tasks.filter(t => !t.is_completed).length > 0 ? (
                tasks
                  .filter(t => !t.is_completed)
                  .map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={handleOpenEdit}
                      onDelete={deleteTask}
                    />
                  ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">🕊️</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Zero active intentions. Your sanctuary is peaceful.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completed View */}
          {activeTab === 'completed' && (
            <div className="space-y-2">
              {completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onEdit={handleOpenEdit}
                    onDelete={deleteTask}
                  />
                ))
              ) : (
                <div className="py-12 text-center p-6 rounded-3xl bg-stone-50/50 dark:bg-zinc-900/40 border border-dashed border-stone-200 dark:border-zinc-800">
                  <p className="text-3xl mb-2">✨</p>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    No accomplished intentions yet. Every step forward counts.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <TaskEditorModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
      />
    </div>
  );
};

export default TasksHub;
