import { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AppSection =
  | 'timeline'
  | 'calendar'
  | 'tasks'
  | 'profile'
  | 'search'
  | 'mystuff'
  | 'entry'
  | 'editor';

export type BottomNavTab = 'home' | 'calendar' | 'tasks' | 'profile' | null;

export interface ActiveNavigationInfo {
  section: AppSection;
  activeBottomTab: BottomNavTab;
  isEditing: boolean;
  isSubSection: boolean;
  activeJournal: string | null;
  activeDateFilter: string | null;
  isTabActive: (tabId: 'home' | 'calendar' | 'tasks' | 'profile') => boolean;
  navigateToTab: (tabId: 'home' | 'calendar' | 'tasks' | 'profile') => void;
}

/**
 * Universal hook providing a single source of truth for app-wide navigation state.
 * Normalizes route recognition, sub-route relationships, query parameters,
 * and resilient mobile bottom navigation.
 */
export function useActiveNavigation(): ActiveNavigationInfo {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeJournal = queryParams.get('journal');
  const activeDateFilter = queryParams.get('date');

  const { section, activeBottomTab, isEditing, isSubSection } = useMemo(() => {
    const pathname = location.pathname;

    const editing = pathname.includes('/edit') || pathname.includes('/new');
    if (editing) {
      return {
        section: 'editor' as AppSection,
        activeBottomTab: null as BottomNavTab,
        isEditing: true,
        isSubSection: false,
      };
    }

    if (pathname.includes('/entry/')) {
      // Entry detail is a child/sub-page of the diary timeline
      return {
        section: 'entry' as AppSection,
        activeBottomTab: 'home' as BottomNavTab,
        isEditing: false,
        isSubSection: true,
      };
    }

    if (pathname.includes('/calendar')) {
      return {
        section: 'calendar' as AppSection,
        activeBottomTab: 'calendar' as BottomNavTab,
        isEditing: false,
        isSubSection: false,
      };
    }

    if (pathname.includes('/tasks')) {
      return {
        section: 'tasks' as AppSection,
        activeBottomTab: 'tasks' as BottomNavTab,
        isEditing: false,
        isSubSection: false,
      };
    }

    if (pathname.includes('/profile')) {
      return {
        section: 'profile' as AppSection,
        activeBottomTab: 'profile' as BottomNavTab,
        isEditing: false,
        isSubSection: false,
      };
    }

    if (pathname.includes('/search')) {
      return {
        section: 'search' as AppSection,
        activeBottomTab: null as BottomNavTab,
        isEditing: false,
        isSubSection: true,
      };
    }

    if (pathname.includes('/mystuff')) {
      return {
        section: 'mystuff' as AppSection,
        activeBottomTab: null as BottomNavTab,
        isEditing: false,
        isSubSection: true,
      };
    }

    // Default: Timeline (/app)
    return {
      section: 'timeline' as AppSection,
      activeBottomTab: 'home' as BottomNavTab,
      isEditing: false,
      isSubSection: false,
    };
  }, [location.pathname]);

  const isTabActive = useCallback(
    (tabId: 'home' | 'calendar' | 'tasks' | 'profile'): boolean => {
      return activeBottomTab === tabId;
    },
    [activeBottomTab]
  );

  const navigateToTab = useCallback(
    (tabId: 'home' | 'calendar' | 'tasks' | 'profile') => {
      switch (tabId) {
        case 'home':
          // If on sub-route, entry, or filtered timeline, return to clean timeline
          if (location.pathname !== '/app' || location.search !== '') {
            navigate('/app');
          } else {
            // Already on clean timeline, scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const mainContainer = document.querySelector('main');
            if (mainContainer) {
              mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          break;
        case 'calendar':
          if (location.pathname !== '/app/calendar') {
            navigate('/app/calendar');
          }
          break;
        case 'tasks':
          if (location.pathname !== '/app/tasks') {
            navigate('/app/tasks');
          }
          break;
        case 'profile':
          if (location.pathname !== '/app/profile') {
            navigate('/app/profile');
          }
          break;
      }
    },
    [location.pathname, location.search, navigate]
  );

  return {
    section,
    activeBottomTab,
    isEditing,
    isSubSection,
    activeJournal,
    activeDateFilter,
    isTabActive,
    navigateToTab,
  };
}
