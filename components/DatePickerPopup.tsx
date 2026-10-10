import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface DatePickerPopupProps {
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const portalRoot = document.getElementById('portal-root');
const POPUP_WIDTH = 256; // Corresponds to w-64 in Tailwind

const DatePickerPopup = ({ currentDate, onSelectDate, onClose, triggerRef }: DatePickerPopupProps) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const rightAlignedLeft = rect.right - POPUP_WIDTH;
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rightAlignedLeft < 0 ? rect.left : rightAlignedLeft,
      });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  const changeMonth = (amount: number) => {
    setDisplayDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const renderCells = () => {
    const monthStart = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const cells = [];
    let day = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const cloneDay = new Date(day);
      const isSelected = cloneDay.toDateString() === currentDate.toDateString();
      const isCurrentMonth = cloneDay.getMonth() === displayDate.getMonth();
      
      cells.push(
        <div
          key={day.toISOString()}
          className={`flex items-center justify-center h-8 w-8 rounded-full text-sm cursor-pointer transition-colors ${
            isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
          } ${
            isSelected ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          onClick={() => onSelectDate(cloneDay)}
        >
          {cloneDay.getDate()}
        </div>
      );
      day.setDate(day.getDate() + 1);
    }
    return cells;
  };

  if (!portalRoot || !position) return null;

  return ReactDOM.createPortal(
    <div 
      ref={popupRef} 
      className="absolute bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 w-64 animate-fade-in-down"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
    >
       <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">{renderCells()}</div>
    </div>,
    portalRoot
  );
};

export default DatePickerPopup;
