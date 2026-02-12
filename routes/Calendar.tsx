import React from 'react';
import CalendarView from '../components/CalendarView';
import { useDiary } from '../DiaryLayout';
import { useNavigate } from 'react-router-dom';

const Calendar: React.FC = () => {
  const { entries } = useDiary();
  const navigate = useNavigate();

  const handleDateSelect = (date: Date) => {
    // Convert date to YYYY-MM-DD in local time
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    navigate(`/app?date=${dateStr}`);
  };

  const handleCreateEntry = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    navigate(`/app/new?date=${dateStr}`);
  };

  return (
    <CalendarView
        entries={entries}
        onSelectDate={handleDateSelect}
        onCreateEntry={handleCreateEntry}
        onBack={() => navigate('/app')}
    />
  );
};

export default Calendar;