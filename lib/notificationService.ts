/**
 * Sanctuary 3-Tier Notification Privacy Service
 * Controls discretion levels for task reminders:
 * 1. Normal: Displays actual task title ("Pick up prescription")
 * 2. Private (Default): "You have a personal task scheduled." (Zero leaks)
 * 3. Ultra-Private: "Diary • A gentle reflection awaits." (Indistinguishable from journal)
 */

export type NotificationPrivacyMode = 'normal' | 'private' | 'ultra';

const STORAGE_KEY = 'diary_notification_privacy_mode';

export interface PrivacyModeOption {
  value: NotificationPrivacyMode;
  label: string;
  icon: string;
  description: string;
  preview: string;
}

export const PRIVACY_MODE_OPTIONS: PrivacyModeOption[] = [
  {
    value: 'normal',
    label: 'Normal (Clear)',
    icon: '🔔',
    description: 'Displays the actual task title in the reminder.',
    preview: '"Take medication at 8:00 PM"',
  },
  {
    value: 'private',
    label: 'Private Sanctuary (Recommended)',
    icon: '🛡️',
    description: 'Masks task title while reminding you of a commitment.',
    preview: '"You have a personal task scheduled."',
  },
  {
    value: 'ultra',
    label: 'Ultra-Private Discretion',
    icon: '🤫',
    description: 'Completely anonymous; appears identical to a diary note.',
    preview: '"Diary • A gentle reflection awaits."',
  },
];

export const notificationService = {
  /**
   * Retrieves the current user privacy mode (defaults to 'private').
   */
  getPrivacyMode(): NotificationPrivacyMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as NotificationPrivacyMode;
      if (saved && ['normal', 'private', 'ultra'].includes(saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'private';
  },

  /**
   * Updates the privacy mode preference.
   */
  setPrivacyMode(mode: NotificationPrivacyMode): void {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed to save notification privacy mode:', err);
    }
  },

  /**
   * Requests browser notification permissions.
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission === 'denied') {
      return false;
    }
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  /**
   * Formats the notification text according to the selected discretion tier.
   */
  formatNotification(taskTitle: string, modeOverride?: NotificationPrivacyMode): { title: string; body: string } {
    const mode = modeOverride || this.getPrivacyMode();

    switch (mode) {
      case 'normal':
        return {
          title: '✅ Personal Task',
          body: taskTitle,
        };
      case 'private':
        return {
          title: '🌿 Diary Sanctuary',
          body: 'You have a personal task scheduled.',
        };
      case 'ultra':
      default:
        return {
          title: '📔 Diary',
          body: 'A gentle reflection awaits.',
        };
    }
  },

  /**
   * Dispatches a discreet browser notification if permission is granted.
   */
  notify(taskTitle: string, modeOverride?: NotificationPrivacyMode): boolean {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const content = this.formatNotification(taskTitle, modeOverride);
      new Notification(content.title, {
        body: content.body,
        icon: '/diary/pwa-icon.svg',
      });
      return true;
    } catch (err) {
      console.warn('Failed to dispatch notification:', err);
      return false;
    }
  },
};
