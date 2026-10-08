import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import ConfirmationModal from './ConfirmationModal';

export const PWAUpdateManager: React.FC = () => {
  const intervalMS = 60 * 60 * 1000; // 1 hour

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;

      // 1. Polling: Check for updates every hour.
      setInterval(() => {
        if (!(!r.installing && navigator)) return;
        if (('connection' in navigator) && !navigator.onLine) return; // Don't poll if offline
        r.update();
      }, intervalMS);

      // 2. Visibility Check: Force a check when the user switches back to the tab
      document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'visible') {
             r.update();
         }
      });
    },

    // 3. Update Found: Triggered when a new SW is waiting
    onNeedRefresh() {
       // Handled by state needRefresh
    }
  });

  return (
    <ConfirmationModal
      isOpen={needRefresh}
      title="Update Available"
      message="A new version of the app is ready. Would you like to update now?"
      confirmLabel="Update Now"
      cancelLabel="Later"
      onConfirm={() => updateServiceWorker(true)}
      onCancel={() => setNeedRefresh(false)}
      type="info"
    />
  );
};

export default PWAUpdateManager;
