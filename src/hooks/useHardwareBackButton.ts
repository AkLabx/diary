import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

export type BackHandler = () => boolean | Promise<boolean>;

interface RegistryEntry {
    id: number;
    priority: number;
    handler: BackHandler;
}

let registry: RegistryEntry[] = [];
let nextId = 0;
let isKeyboardVisible = false;

// Priority Constants
export const PRIORITIES = {
    LOCK: 100,
    AUTH_INIT: 90,
    KEYBOARD: 85, // Handled internally, but listed for reference
    FULLSCREEN: 80, // Handled internally
    OVERLAY: 70,
    SEARCH_SELECT: 65,
    EDITOR: 60,
    HIERARCHY: 0,
};

// Export for testing
export const _getRegistry = () => registry;
export const _clearRegistry = () => { registry = []; };

export const registerBackHandler = (priority: number, handler: BackHandler) => {
    const id = nextId++;
    registry.push({ id, priority, handler });
    // Sort descending by priority, then by id descending (most recent first for same priority)
    registry.sort((a, b) => {
        if (a.priority !== b.priority) {
            return b.priority - a.priority;
        }
        return b.id - a.id;
    });

    return () => {
        registry = registry.filter(entry => entry.id !== id);
    };
};

export const useBackHandler = (priority: number, handler: BackHandler, isActive: boolean = true) => {
    // We use a ref to hold the latest handler so the registered closure always calls the fresh one
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (!isActive) return;
        const unregister = registerBackHandler(priority, () => {
             return handlerRef.current();
        });
        return unregister;
    }, [priority, isActive]);
};

export const getParentPath = (currentPath: string): string | null => {
    // Ignore trailing slash
    const path = currentPath.endsWith('/') && currentPath.length > 1 ? currentPath.slice(0, -1) : currentPath;

    // Roots
    if (path === '/' || path === '/login') return null;
    if (['/app', '/app/calendar', '/app/search', '/app/profile', '/app/mystuff'].includes(path)) {
        return null;
    }

    // Terms / Privacy - if they are opened independently they might minimize,
    // but typically we'll rely on history. Let's return null to fallback to history or minimize
    if (path.startsWith('/privacy') || path.startsWith('/terms')) return null;

    // Nested
    if (path.startsWith('/app/mystuff/')) {
        return '/app/mystuff';
    }

    if (path.match(/^\/app\/entry\/[^/]+$/)) {
        return '/app';
    }

    if (path.match(/^\/app\/edit\/[^/]+$/)) {
        // Fallback parent for edit is the entry view. History check should preferably catch it if they came from entry.
        const id = path.split('/app/edit/')[1];
        return `/app/entry/${id}`;
    }

    if (path === '/app/new') {
        return '/app';
    }

    return null;
};

// History Tracking
let pathByIdx: { [idx: number]: string } = {};

export const _getPathByIdx = () => pathByIdx;
export const _setPathByIdx = (idx: number, path: string) => { pathByIdx[idx] = path; };
export const _clearPathByIdx = () => { pathByIdx = {}; };

export const useHardwareBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigateRef = useRef(navigate);
    const locationRef = useRef(location);
    const isNavigatingRef = useRef(false);

    useEffect(() => {
        navigateRef.current = navigate;
        locationRef.current = location;

        // Track history
        const state = window.history.state as any;
        const idx = state?.idx;

        if (typeof idx === 'number') {
             // Drop future entries on push
             for (const key of Object.keys(pathByIdx)) {
                 if (parseInt(key) > idx) {
                     delete pathByIdx[parseInt(key)];
                 }
             }
             pathByIdx[idx] = location.pathname;
        }

    }, [navigate, location]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Track Keyboard state
        const sub1 = Keyboard.addListener('keyboardWillShow', () => { isKeyboardVisible = true; });
        const sub2 = Keyboard.addListener('keyboardWillHide', () => { isKeyboardVisible = false; });
        const sub3 = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) isKeyboardVisible = false;
        });

        const handleBackButton = async () => {
            if (isNavigatingRef.current) return;
            isNavigatingRef.current = true;

            try {
                // 1. Check Registry (Lock, Modals, Editor)
                for (const entry of registry) {
                    // Inject keyboard check at the right priority dynamically
                    if (entry.priority < PRIORITIES.KEYBOARD && isKeyboardVisible) {
                         await Keyboard.hide();
                         return; // Consumed
                    }

                    if (entry.priority < PRIORITIES.FULLSCREEN && document.fullscreenElement) {
                        await document.exitFullscreen();
                        return; // Consumed
                    }

                    try {
                        const consumed = await entry.handler();
                        if (consumed) return;
                    } catch (e) {
                        console.error('Error in back handler', e);
                    }
                }

                // If keyboard was visible but no handler was < KEYBOARD priority (e.g. at root)
                if (isKeyboardVisible) {
                    await Keyboard.hide();
                    return;
                }

                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                    return;
                }

                // 2. Hierarchy Navigation
                const currentPath = locationRef.current.pathname;
                const state = window.history.state as any;
                const idx = state?.idx;
                const parentPath = getParentPath(currentPath);

                if (parentPath === null) {
                    // Root view -> Minimize
                    await App.minimizeApp();
                } else {
                    // Determine if previous entry is the logical parent
                    let usedHistory = false;
                    if (typeof idx === 'number' && pathByIdx[idx - 1] === parentPath) {
                        navigateRef.current(-1);
                        usedHistory = true;
                    }

                    if (!usedHistory) {
                        navigateRef.current(parentPath, { replace: true });
                    }
                }

            } finally {
                // Global lock release
                setTimeout(() => {
                    isNavigatingRef.current = false;
                }, 100);
            }
        };

        const listener = App.addListener('backButton', handleBackButton);

        return () => {
            listener.then(l => l.remove());
            sub1.then(l => l.remove());
            sub2.then(l => l.remove());
            sub3.then(l => l.remove());
        };
    }, []);
};
