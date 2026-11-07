import { PersonalTask } from '../types';
import { getCategoryMeta, ENERGY_LEVELS, IMPORTANCE_LEVELS } from './taskUtils';
import { formatRecurrenceLabel } from './recurrenceEngine';

/**
 * Sanctuary Multi-Format Task Exporter
 * Exports decrypted tasks into Markdown, CSV, and JSON.
 */

export const taskExport = {
  /**
   * Generates a beautifully formatted Markdown export suitable for Obsidian, Notion, or local archives.
   */
  generateMarkdown(tasks: PersonalTask[]): string {
    const today = new Date().toISOString().split('T')[0];
    const activeTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);

    let md = `# 🌿 Personal Tasks & Sanctuary Archive\n\n`;
    md += `*Exported on ${today} • Total Tasks: ${tasks.length} (${activeTasks.length} active, ${completedTasks.length} accomplished)*\n\n`;
    md += `---\n\n`;

    md += `## ⏳ Active Tasks (${activeTasks.length})\n\n`;
    if (activeTasks.length === 0) {
      md += `*No active tasks. Peace of mind restored.*\n\n`;
    } else {
      for (const t of activeTasks) {
        const title = t.decrypted?.title || '🔒 Encrypted Task';
        const notes = t.decrypted?.notes;
        const cat = getCategoryMeta(t.category_code);
        const energy = ENERGY_LEVELS.find(e => e.value === t.energy_level) || ENERGY_LEVELS[0];
        const importance = IMPORTANCE_LEVELS.find(i => i.value === t.importance_level) || IMPORTANCE_LEVELS[1];
        const recurrence = t.decrypted?.recurrence ? formatRecurrenceLabel(t.decrypted.recurrence) : '';
        const dueDate = t.due_date || 'Someday';

        md += `- [ ] **${title}**\n`;
        md += `  - 📅 **Due:** ${dueDate}\n`;
        md += `  - 🏷️ **Realm:** ${cat.icon} ${cat.label}\n`;
        md += `  - ⚡ **Energy & Importance:** ${energy.icon} ${energy.label} | ${importance.icon} ${importance.label}\n`;
        if (recurrence) {
          md += `  - 🔁 **Recurrence:** ${recurrence}\n`;
        }
        if (notes) {
          md += `  - 📝 **Notes:**\n`;
          const indentedNotes = notes.split('\n').map(line => `    > ${line}`).join('\n');
          md += `${indentedNotes}\n`;
        }
        md += `\n`;
      }
    }

    md += `## ✨ Completed Sanctuary (${completedTasks.length})\n\n`;
    if (completedTasks.length === 0) {
      md += `*No completed tasks yet.*\n\n`;
    } else {
      for (const t of completedTasks) {
        const title = t.decrypted?.title || '🔒 Encrypted Task';
        const completedDate = t.completed_at ? t.completed_at.split('T')[0] : 'Unknown date';
        const cat = getCategoryMeta(t.category_code);

        md += `- [x] **${title}** *(Completed: ${completedDate})* — ${cat.icon} ${cat.label}\n`;
      }
    }

    return md;
  },

  /**
   * Generates a standard RFC 4180 CSV spreadsheet export.
   */
  generateCSV(tasks: PersonalTask[]): string {
    const headers = [
      'ID',
      'Status',
      'Title',
      'Notes',
      'Category',
      'Energy Level',
      'Importance',
      'Recurrence',
      'Due Date',
      'Completed At',
      'Created At',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = tasks.map(t => {
      const cat = getCategoryMeta(t.category_code);
      const energy = ENERGY_LEVELS.find(e => e.value === t.energy_level) || ENERGY_LEVELS[0];
      const importance = IMPORTANCE_LEVELS.find(i => i.value === t.importance_level) || IMPORTANCE_LEVELS[1];

      return [
        escapeCSV(t.id),
        escapeCSV(t.is_completed ? 'Completed' : 'Active'),
        escapeCSV(t.decrypted?.title || 'Encrypted Task'),
        escapeCSV(t.decrypted?.notes || ''),
        escapeCSV(cat.label),
        escapeCSV(energy.label),
        escapeCSV(importance.label),
        escapeCSV(t.decrypted?.recurrence || 'none'),
        escapeCSV(t.due_date || ''),
        escapeCSV(t.completed_at || ''),
        escapeCSV(t.created_at || ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Generates an uncompressed decrypted JSON backup export.
   */
  generateJSON(tasks: PersonalTask[]): string {
    const exportData = {
      exported_at: new Date().toISOString(),
      format: 'diary_personal_tasks_v1',
      total: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        is_completed: t.is_completed,
        due_date: t.due_date,
        category: getCategoryMeta(t.category_code).label,
        category_code: t.category_code,
        energy_level: t.energy_level,
        importance_level: t.importance_level,
        title: t.decrypted?.title,
        notes: t.decrypted?.notes,
        recurrence: t.decrypted?.recurrence || 'none',
        reminder_time: t.decrypted?.reminderTime,
        created_at: t.created_at,
        completed_at: t.completed_at,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Triggers direct browser download for the given content.
   */
  download(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  /**
   * Convenience helpers
   */
  exportMarkdown(tasks: PersonalTask[]) {
    const today = new Date().toISOString().split('T')[0];
    const md = this.generateMarkdown(tasks);
    this.download(`tasks_export_${today}.md`, md, 'text/markdown;charset=utf-8');
  },

  exportCSV(tasks: PersonalTask[]) {
    const today = new Date().toISOString().split('T')[0];
    const csv = this.generateCSV(tasks);
    this.download(`tasks_export_${today}.csv`, csv, 'text/csv;charset=utf-8');
  },

  exportJSON(tasks: PersonalTask[]) {
    const today = new Date().toISOString().split('T')[0];
    const json = this.generateJSON(tasks);
    this.download(`tasks_export_${today}.json`, json, 'application/json;charset=utf-8');
  },
};
