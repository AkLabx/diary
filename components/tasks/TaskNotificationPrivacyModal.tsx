import React, { useState, useEffect } from 'react';
import {
  notificationService,
  NotificationPrivacyMode,
  PRIVACY_MODE_OPTIONS,
} from '../../lib/notificationService';

interface TaskNotificationPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskNotificationPrivacyModal: React.FC<TaskNotificationPrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<NotificationPrivacyMode>('private');
  const [permissionState, setPermissionState] = useState<string>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(notificationService.getPrivacyMode());
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectMode = (mode: NotificationPrivacyMode) => {
    setSelectedMode(mode);
    notificationService.setPrivacyMode(mode);
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
    if (granted) {
      notificationService.notify('Prescription refill scheduled', selectedMode);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleSendTest = () => {
    notificationService.notify('Health checkup appointment', selectedMode);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-zinc-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="text-lg font-semibold text-stone-800 dark:text-zinc-100">
              Notification Privacy & Discretion
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

        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-3">
          Configure how task reminders appear on lock screens and desktop banners to prevent bystanders from viewing sensitive reminders.
        </p>

        {/* 3 Privacy Modes */}
        <div className="space-y-3 mt-4">
          {PRIVACY_MODE_OPTIONS.map(opt => {
            const isSelected = selectedMode === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelectMode(opt.value)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-stone-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-stone-800 dark:text-zinc-100">
                      {opt.label}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-stone-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 pl-7">
                  {opt.description}
                </p>
                <div className="mt-2 pl-7">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-mono bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300">
                    Preview: {opt.preview}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Permission and Test Bar */}
        <div className="mt-5 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600 dark:text-zinc-400">
            {permissionState === 'granted' ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Notifications Enabled
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Permission Required
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {permissionState !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                Enable Notifications
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendTest}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all cursor-pointer"
              >
                {testSent ? '✓ Notification Dispatched!' : 'Test Notification'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
