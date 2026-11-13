import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { PersonalTask, DecryptedTaskPayload } from '../types';
import { taskService } from '../lib/taskService';
import { encryptTaskPayload, decryptTaskPayload } from '../lib/taskCrypto';
import { useCrypto } from './CryptoContext';
import { useToast } from './ToastContext';
import { computeNextDueDate } from '../lib/recurrenceEngine';

interface TaskContextType {
  tasks: PersonalTask[];
  loading: boolean;
  createTask: (
    payload: DecryptedTaskPayload,
    meta: {
      due_date?: string | null;
      category_code: number;
      energy_level: 1 | 2 | 3;
      importance_level: 1 | 2 | 3;
      entry_id?: string | null;
    }
  ) => Promise<PersonalTask | null>;
  updateTask: (
    id: string,
    payload: DecryptedTaskPayload,
    meta?: {
      due_date?: string | null;
      category_code?: number;
      energy_level?: 1 | 2 | 3;
      importance_level?: 1 | 2 | 3;
      entry_id?: string | null;
    }
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  todayTasks: PersonalTask[];
  upcomingTasks: PersonalTask[];
  completedTasks: PersonalTask[];
  carriedForwardTasks: PersonalTask[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode; userId?: string | null }> = ({
  children,
  userId,
}) => {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { key } = useCrypto();
  const { addToast } = useToast();

  const decryptSingleTask = useCallback(async (task: PersonalTask, cryptoKey: CryptoKey): Promise<PersonalTask> => {
    try {
      const decrypted = await decryptTaskPayload(cryptoKey, task.encrypted_task, task.iv, {
        taskId: task.id,
        ownerId: task.owner_id,
        version: task.version,
      });
      return {
        ...task,
        decrypted,
        isDecrypted: true,
      };
    } catch (err) {
      console.warn(`Could not decrypt task ${task.id}:`, err);
      return {
        ...task,
        decrypted: { title: '🔒 Private Task' },
        isDecrypted: false,
      };
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!userId || !key) return;
    setLoading(true);
    try {
      const rawTasks = await taskService.fetchTasks(userId);
      const decryptedTasks = await Promise.all(
        rawTasks.map(t => decryptSingleTask(t, key))
      );
      setTasks(decryptedTasks);
    } catch (err: any) {
      console.error('Failed to load personal tasks:', err);
      addToast('Unable to load private tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, key, decryptSingleTask, addToast]);

  useEffect(() => {
    if (userId && key) {
      refreshTasks();
    } else {
      setTasks([]);
    }
  }, [userId, key, refreshTasks]);

  const createTask = useCallback(
    async (
      payload: DecryptedTaskPayload,
      meta: {
        due_date?: string | null;
        category_code: number;
        energy_level: 1 | 2 | 3;
        importance_level: 1 | 2 | 3;
        entry_id?: string | null;
      }
    ): Promise<PersonalTask | null> => {
      if (!userId || !key) {
        addToast('Encryption key required to create task', 'error');
        return null;
      }

      try {
        const tempId = window.crypto.randomUUID();
        const encrypted = await encryptTaskPayload(key, payload, {
          taskId: tempId,
          ownerId: userId,
          version: 1,
        });

        const created = await taskService.createTask({
          owner_id: userId,
          entry_id: meta.entry_id || null,
          encrypted_task: encrypted.encrypted_task,
          iv: encrypted.iv,
          checksum: encrypted.checksum,
          key_version: encrypted.key_version,
          schema_version: encrypted.schema_version,
          due_date: meta.due_date || null,
          category_code: meta.category_code,
          energy_level: meta.energy_level,
          importance_level: meta.importance_level,
        });

        const fullTask: PersonalTask = {
          ...created,
          decrypted: payload,
          isDecrypted: true,
        };

        setTasks(prev => [fullTask, ...prev]);
        addToast('Task created', 'success');
        return fullTask;
      } catch (err: any) {
        console.error('Failed to create task:', err);
        addToast('Failed to save task', 'error');
        return null;
      }
    },
    [userId, key, addToast]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const target = tasks.find(t => t.id === id);
      if (!target) return;

      const nextStatus = !target.is_completed;

      // Optimistic update
      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                is_completed: nextStatus,
                completed_at: nextStatus ? new Date().toISOString() : null,
                version: t.version + 1,
              }
            : t
        )
      );

      try {
        await taskService.toggleTaskCompletion(id, nextStatus, target.version);

        // If completed and recurring, schedule the next occurrence
        if (nextStatus && target.decrypted?.recurrence && target.decrypted.recurrence !== 'none') {
          const nextDate = computeNextDueDate(target.decrypted.recurrence, target.due_date);
          if (nextDate) {
            await createTask(
              {
                ...target.decrypted,
                subtasks: target.decrypted.subtasks?.map(s => ({ ...s, done: false })),
              },
              {
                due_date: nextDate,
                category_code: target.category_code,
                energy_level: target.energy_level,
                importance_level: target.importance_level,
                entry_id: target.entry_id,
              }
            );
            addToast(`Task completed! Next recurrence scheduled for ${nextDate}`, 'success');
          }
        }
      } catch (err: any) {
        console.error('Failed to toggle task:', err);
        // Rollback
        setTasks(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...t,
                  is_completed: target.is_completed,
                  completed_at: target.completed_at,
                  version: target.version,
                }
              : t
          )
        );
        addToast('Failed to update task state', 'error');
      }
    },
    [tasks, addToast, createTask]
  );

  const updateTask = useCallback(
    async (
      id: string,
      payload: DecryptedTaskPayload,
      meta?: {
        due_date?: string | null;
        category_code?: number;
        energy_level?: 1 | 2 | 3;
        importance_level?: 1 | 2 | 3;
        entry_id?: string | null;
      }
    ) => {
      const target = tasks.find(t => t.id === id);
      if (!target || !key || !userId) return;

      try {
        const nextVersion = target.version + 1;
        const encrypted = await encryptTaskPayload(key, payload, {
          taskId: id,
          ownerId: userId,
          version: nextVersion,
        });

        const updates: Partial<PersonalTask> = {
          encrypted_task: encrypted.encrypted_task,
          iv: encrypted.iv,
          checksum: encrypted.checksum,
          ...(meta?.due_date !== undefined && { due_date: meta.due_date }),
          ...(meta?.category_code !== undefined && { category_code: meta.category_code }),
          ...(meta?.energy_level !== undefined && { energy_level: meta.energy_level }),
          ...(meta?.importance_level !== undefined && { importance_level: meta.importance_level }),
          ...(meta?.entry_id !== undefined && { entry_id: meta.entry_id }),
        };

        const updated = await taskService.updateTask(id, target.version, updates);

        setTasks(prev =>
          prev.map(t =>
            t.id === id
              ? {
                  ...updated,
                  decrypted: payload,
                  isDecrypted: true,
                }
              : t
          )
        );
        addToast('Task updated', 'success');
      } catch (err: any) {
        console.error('Failed to update task:', err);
        addToast('Failed to update task', 'error');
      }
    },
    [tasks, key, userId, addToast]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const target = tasks.find(t => t.id === id);
      if (!target) return;

      // Optimistic delete
      setTasks(prev => prev.filter(t => t.id !== id));

      try {
        await taskService.softDeleteTask(id, target.version);
        addToast('Task deleted', 'info');
      } catch (err: any) {
        console.error('Failed to soft delete task:', err);
        // Rollback
        setTasks(prev => [target, ...prev]);
        addToast('Failed to delete task', 'error');
      }
    },
    [tasks, addToast]
  );

  // Grouped task selectors
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => !t.is_completed && t.due_date === todayStr);
  }, [tasks, todayStr]);

  const carriedForwardTasks = useMemo(() => {
    return tasks.filter(t => !t.is_completed && t.due_date && t.due_date < todayStr);
  }, [tasks, todayStr]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => !t.is_completed && (!t.due_date || t.due_date > todayStr));
  }, [tasks, todayStr]);

  const completedTasks = useMemo(() => {
    return tasks.filter(t => t.is_completed);
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        createTask,
        updateTask,
        toggleTask,
        deleteTask,
        refreshTasks,
        todayTasks,
        upcomingTasks,
        completedTasks,
        carriedForwardTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePersonalTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('usePersonalTasks must be used within a TaskProvider');
  }
  return context;
};
