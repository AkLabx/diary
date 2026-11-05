import { supabase } from './supabaseClient';
import { PersonalTask } from '../types';

export const taskService = {
  /**
   * Fetches all active personal tasks for the authenticated owner.
   */
  async fetchTasks(ownerId: string): Promise<PersonalTask[]> {
    const { data, error } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('owner_id', ownerId)
      .is('deleted_at', null)
      .order('is_completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching personal tasks from Supabase:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      isDecrypted: false,
    }));
  },

  /**
   * Creates a new personal task.
   */
  async createTask(taskData: {
    owner_id: string;
    entry_id?: string | null;
    encrypted_task: string;
    iv: string;
    checksum: string;
    key_version: number;
    schema_version: number;
    due_date?: string | null;
    category_code: number;
    energy_level: 1 | 2 | 3;
    importance_level: 1 | 2 | 3;
  }): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from('personal_tasks')
      .insert({
        owner_id: taskData.owner_id,
        entry_id: taskData.entry_id || null,
        encrypted_task: taskData.encrypted_task,
        iv: taskData.iv,
        checksum: taskData.checksum,
        key_version: taskData.key_version,
        schema_version: taskData.schema_version,
        version: 1,
        is_completed: false,
        due_date: taskData.due_date || null,
        category_code: taskData.category_code,
        energy_level: taskData.energy_level,
        importance_level: taskData.importance_level,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting personal task:', error);
      throw error;
    }

    return { ...data, isDecrypted: true };
  },

  /**
   * Toggles task completion state with monotonic version increment.
   */
  async toggleTaskCompletion(id: string, isCompleted: boolean, currentVersion: number): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from('personal_tasks')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        version: (currentVersion || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }

    return data;
  },

  /**
   * Updates task metadata or re-encrypted payload with monotonic version increment.
   */
  async updateTask(
    id: string,
    currentVersion: number,
    updates: Partial<PersonalTask>
  ): Promise<PersonalTask> {
    const payload: any = {
      ...updates,
      version: (currentVersion || 1) + 1,
      updated_at: new Date().toISOString(),
    };
    delete payload.decrypted;
    delete payload.isDecrypted;
    delete payload.isLoading;

    const { data, error } = await supabase
      .from('personal_tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating personal task:', error);
      throw error;
    }

    return data;
  },

  /**
   * Soft deletes a task (sets deleted_at) with version increment.
   */
  async softDeleteTask(id: string, currentVersion: number): Promise<void> {
    const { error } = await supabase
      .from('personal_tasks')
      .update({
        deleted_at: new Date().toISOString(),
        version: (currentVersion || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft-deleting task:', error);
      throw error;
    }
  },

  /**
   * Restores a soft-deleted task.
   */
  async restoreTask(id: string, currentVersion: number): Promise<PersonalTask> {
    const { data, error } = await supabase
      .from('personal_tasks')
      .update({
        deleted_at: null,
        version: (currentVersion || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error restoring personal task:', error);
      throw error;
    }

    return data;
  },
};
