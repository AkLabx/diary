import React, { useState, useMemo } from 'react';
import { DiaryEntry } from '../types';
import DateInteractionMenu from './DateInteractionMenu';

interface CalendarViewProps {
  entries: DiaryEntry[];
  onSelectDate: (date: Date) => void;
  onCreateEntry: (date: Date) => void;
  onBack: () => void;
}

const toLocalDateString = (date: Date): string => {
    // This trick adjusts for the timezone offset to get the local date's YYYY-MM-DD representation
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
};

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectDate, onCreateEntry, onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interactionDate, setInteractionDate] = useState<Date | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | undefined>(undefined);

  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
      // Convert UTC timestamp to local date string for accurate mapping
      dates.add(toLocalDateString(new Date(entry.created_at)));
    });
    return dates;
  }, [entries]);

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">&lt;</button>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h2>
      <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">&gt;</button>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 dark:text-slate-400 text-sm">
        {days.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    let days = [];
    let day = startDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayKey = toLocalDateString(cloneDay);
        const hasEntry = entryDates.has(dayKey);
        const isFuture = cloneDay > today;
        const isCurrentMonth = cloneDay.getMonth() === currentDate.getMonth();
        
        days.push(
          <div
            key={day.toString()}
            className={`p-1 h-20 flex flex-col items-center justify-center rounded-lg transition-colors relative
              ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}
              ${hasEntry ? 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30' : ''}
              ${!isFuture ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50' : 'opacity-50 cursor-not-allowed'}
              ${hasEntry && !isFuture ? 'hover:!bg-indigo-200 dark:hover:!bg-indigo-500/40' : ''}
            `}
            onClick={(e) => {
                if (isFuture) return;
                const rect = e.currentTarget.getBoundingClientRect();
                // Use viewport coordinates for fixed positioning
                setMenuPosition({ top: rect.bottom, left: rect.left });
                setInteractionDate(cloneDay);
            }}
          >
            <span className={`text-sm ${new Date().toDateString() === cloneDay.toDateString() ? 'bg-indigo-500 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
              {cloneDay.getDate()}
            </span>
            {hasEntry && (
              <div className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full mt-1"></div>
            )}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="animate-fade-in">
      <DateInteractionMenu
          isOpen={!!interactionDate}
          onClose={() => setInteractionDate(null)}
          date={interactionDate || new Date()}
          hasEntries={interactionDate ? entryDates.has(toLocalDateString(interactionDate)) : false}
          onCreate={(date) => {
              setInteractionDate(null);
              onCreateEntry(date);
          }}
          onView={(date) => {
              setInteractionDate(null);
              onSelectDate(date);
          }}
          position={menuPosition}
      />

      <button
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Timeline
      </button>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        {renderHeader()}
        {renderDays()}
        <div className="mt-2">
          {renderCells()}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;