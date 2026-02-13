import React, { useEffect, useRef } from 'react';

interface DateInteractionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  hasEntries: boolean;
  onCreate: (date: Date) => void;
  onView: (date: Date) => void;
  position?: { top: number; left: number }; // Screen coordinates for desktop popover
}

const DateInteractionMenu: React.FC<DateInteractionMenuProps> = ({
  isOpen,
  onClose,
  date,
  hasEntries,
  onCreate,
  onView,
  position
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close on click outside (for popover)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = menuRef.current && menuRef.current.contains(target);
      const inMobile = mobileMenuRef.current && mobileMenuRef.current.contains(target);

      if (!inDesktop && !inMobile) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dateString = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Mobile Modal Layout
  const MobileModal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose}>
      <div
        ref={mobileMenuRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{dateString}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
        <div className="p-2 space-y-1">
            {hasEntries && (
                <button
                    onClick={() => onView(date)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
                >
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <div>
                        <div className="font-medium">View Entries</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">See what you wrote on this day</div>
                    </div>
                </button>
            )}
            <button
                onClick={() => onCreate(date)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
            >
                <span className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </span>
                <div>
                    <div className="font-medium">New Entry</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Write a new diary entry</div>
                </div>
            </button>
        </div>
      </div>
    </div>
  );

  // Desktop Popover Layout
  // Using fixed positioning calculated from parent component to avoid overflow issues
  const DesktopPopover = (
      <div
        ref={menuRef}
        className="hidden lg:block fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 overflow-hidden animate-scale-in origin-top-left"
        style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            transform: 'translate(10px, 10px)' // Offset slightly
        }}
      >
         <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {dateString}
         </div>
         <div className="p-1">
            {hasEntries && (
                <button
                    onClick={() => onView(date)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 transition-colors"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    View Entries
                </button>
            )}
            <button
                onClick={() => onCreate(date)}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Entry
            </button>
         </div>
      </div>
  );

  return (
    <>
        {MobileModal}
        {DesktopPopover}
    </>
  );
};

export default DateInteractionMenu;
