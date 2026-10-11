import React, { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { isAppSaving } from './backButtonRegistry';

export const useAndroidBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    // Use a ref to ensure the event listener always sees the latest addToast function
    const addToastRef = useRef(addToast);
    useEffect(() => {
        addToastRef.current = addToast;
    }, [addToast]);

    const lastBackPress = useRef<number>(0);
    const isNavigating = useRef<boolean>(false);


    const historyStack = useRef<string[]>([]);

    useEffect(() => {
        // Keep a simple stack of the last 10 paths
        historyStack.current.push(location.pathname);
        if (historyStack.current.length > 10) {
            historyStack.current.shift();
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const handleBackButton = async () => {
            const currentTime = new Date().getTime();

            // --- 0. DEBOUNCE & LOCK ---
            if (isNavigating.current || currentTime - lastBackPress.current < 300) {
                return; // Ignore spam presses
            }
            isNavigating.current = true;

            try {
                const currentPath = location.pathname;

                // --- 1. KEYBOARD DISMISSAL ---
                if (document.activeElement &&
                    (document.activeElement.tagName === 'INPUT' ||
                     document.activeElement.tagName === 'TEXTAREA' ||
                     (document.activeElement as HTMLElement).isContentEditable)) {
                    (document.activeElement as HTMLElement).blur();
                    // Optional: Try to dismiss native keyboard as well just to be safe
                    try {
                        await Keyboard.hide();
                    } catch (e) {
                        // ignore error if keyboard wasn't showing or plugin not available
                    }
                    return;
                }

                // --- 2. FULLSCREEN EXIT ---
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                    return;
                }

                // --- 3. MODAL / DRAWER / OVERLAY PRIORITY ---
                const activeOverlays = document.querySelectorAll(
                    '[role="dialog"], .modal, .bottom-sheet, [data-headlessui-state="open"]'
                );
                if (activeOverlays.length > 0) {
                    // Try standard escape key for accessible dialogs
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                    return;
                }

                // --- 4. CRITICAL WORKFLOW PROTECTION ---
                if (isAppSaving) {
                    addToastRef.current('Please wait, saving...', 'info');
                    return;
                }

                // --- 5. DASHBOARD SINGLE EXIT ROOT ---
                // We consider lock screens, intro (login), and timeline as root.
                const exitRoots = ['/', '/login', '/app', '/app/'];

                if (exitRoots.includes(currentPath)) {
                    if (currentTime - lastBackPress.current < 2000) {
                        App.exitApp();
                    } else {
                        lastBackPress.current = currentTime;
                        addToastRef.current('Press back again to exit', 'info');
                    }
                    return;
                }

                // --- 6. DETERMINISTIC HIERARCHICAL MAPPING ---
                let targetPath = '/app'; // Safe fallback

                // Nested routes
                if (currentPath.startsWith('/app/entry/')) {
                    targetPath = '/app';
                } else if (currentPath === '/app/new') {
                    targetPath = '/app';
                } else if (currentPath.startsWith('/app/edit/')) {
                    const id = currentPath.split('/app/edit/')[1];
                    targetPath = `/app/entry/${id}`;
                } else if (currentPath === '/app/mystuff/images' || currentPath === '/app/mystuff/audio') {
                    targetPath = '/app/mystuff';
                } else if (currentPath.startsWith('/app/')) {
                    // This covers /app/mystuff, /app/calendar, /app/search, /app/profile
                    targetPath = '/app';
                }


                // Record time for debounce and root logic
                lastBackPress.current = currentTime;

                // Navigate hierarchically.
                // If the previous history entry is already the parent, use real history-back so the timeline keeps its scroll position and filters.
                const len = historyStack.current.length;
                if (len >= 2 && historyStack.current[len - 2] === targetPath) {
                    navigate(-1);
                } else {
                    navigate(targetPath, { replace: true });
                }


            } finally {
                // Release lock after a short delay
                setTimeout(() => {
                    isNavigating.current = false;
                }, 100);
            }
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.then(l => l.remove());
        };
    }, [navigate, location.pathname]);
};

// Component to render inside the router
export const NativeBackButtonHandler: React.FC = () => {
    useAndroidBackButton();
    return null;
};
