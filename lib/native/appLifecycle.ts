import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

export const registerAppStateChangeListener = async (
  onActive: () => void,
  onInactive: () => void
): Promise<PluginListenerHandle | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const listener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          onActive();
        } else {
          onInactive();
        }
      });
      return listener;
    } catch (e) {
      console.error("Failed to register app state listener", e);
      return null;
    }
  }
  return null;
};
