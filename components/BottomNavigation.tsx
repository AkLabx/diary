import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePersonalTasks } from '../contexts/TaskContext';

interface BottomNavigationProps {
  isVisible: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ isVisible }) => {
  const navigate = useNavigate();
  const { todayTasks, carriedForwardTasks } = usePersonalTasks();
  const activeCount = todayTasks.length + carriedForwardTasks.length;

  if (!isVisible) return null;

  const navItems = [
    {
      path: '/app',
      end: true,
      label: 'Home',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/app/calendar',
      label: 'Calendar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    // Empty spacer for the center FAB
    {
      isSpacer: true,
      path: '',
      label: ''
    },
    {
      path: '/app/tasks',
      label: 'Tasks',
      badge: activeCount > 0 ? activeCount : null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      path: '/app/profile',
      label: 'Profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-[#EAE1D6] dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, index) => {
            if (item.isSpacer) {
              return <div key={`spacer-${index}`} className="w-16" aria-hidden="true" />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path!}
                aria-label={item.label}
                title={item.label}
                end={item.end}
                className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-full transition-colors duration-200 relative ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {({ isActive }) => (
                  <div className={`relative flex items-center justify-center ${isActive ? 'mb-1' : 'mb-0'} transition-all duration-200`}>
                    {item.icon}
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 px-1.5 min-w-[16px] h-4 text-[10px] font-bold rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {/* Active Indicator dot */}
                    <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-200 ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) - Elevated and Layered Above Nav */}
      <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[35] pb-[env(safe-area-inset-bottom,0px)] pointer-events-none">
        <button
          onClick={() => navigate('/app/new')}
          className="pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 shadow-xl shadow-indigo-500/40 transform transition-all active:scale-90 hover:scale-105 flex items-center justify-center border-4 border-[#FBF8F3] dark:border-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          aria-label="New Entry"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default BottomNavigation;
