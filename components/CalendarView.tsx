import React, { useState, useMemo } from 'react';
import { DiaryEntry } from '../types';

interface CalendarViewProps {
  entries: DiaryEntry[];
  onSelectDate: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const entryDates = useMemo(() => {
    const dates = new Set<string>();
    entries.forEach(entry => {
      dates.add(new Date(entry.created_at).toISOString().split('T')[0]);
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
      <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100">&lt;</button>
      <h2 className="text-xl font-bold text-slate-700">
        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </h2>
      <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100">&gt;</button>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 text-sm">
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

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        const dayKey = cloneDay.toISOString().split('T')[0];
        const hasEntry = entryDates.has(dayKey);
        
        days.push(
          <div
            key={day.toString()}
            className={`p-1 h-20 flex flex-col items-center justify-center rounded-lg transition-colors ${
              cloneDay.getMonth() !== currentDate.getMonth() ? 'text-slate-300' : 'text-slate-700'
            } ${hasEntry ? 'cursor-pointer bg-indigo-100 hover:bg-indigo-200' : ''}`}
            onClick={hasEntry ? () => onSelectDate(cloneDay) : undefined}
          >
            <span className={`text-sm ${new Date().toDateString() === cloneDay.toDateString() ? 'bg-indigo-500 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}>
              {cloneDay.getDate()}
            </span>
            {hasEntry && (
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1"></div>
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
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200 animate-fade-in">
      {renderHeader()}
      {renderDays()}
      <div className="mt-2">
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;