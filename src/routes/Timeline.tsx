import React, { useMemo, useEffect, useState } from 'react';
import DiaryList from '../components/DiaryList';
import { useDiary } from '../DiaryLayout';
import { useLocation, useNavigate } from 'react-router-dom';

const Timeline: React.FC = () => {
  const { entries, loadEntryContent, profile } = useDiary();
  const [filteredDate, setFilteredDate] = useState<Date | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeJournal = queryParams.get('journal');
  const dateParam = queryParams.get('date');

  useEffect(() => {
      if (dateParam) {
          const date = new Date(dateParam);
          if (!isNaN(date.getTime())) {
              setFilteredDate(date);
          }
      } else {
          setFilteredDate(null);
      }
  }, [dateParam]);

  const onThisDayEntries = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getDate() === currentDay && entryDate.getFullYear() < today.getFullYear();
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries]);

  let entriesToShow = entries;
  if (activeJournal) {
      entriesToShow = entriesToShow.filter(e => (e.journal || 'Personal') === activeJournal);
  }

  if (filteredDate) {
      // Filter by date (ignoring time)
      // Note: We need to match local date string
      const filterStr = filteredDate.toISOString().split("T")[0];
      entriesToShow = entriesToShow.filter(e => {
          const eDate = new Date(e.created_at);
          // Adjust for timezone offset to compare local dates
          const offset = eDate.getTimezoneOffset();
          const localEDate = new Date(eDate.getTime() - (offset * 60 * 1000));
          return localEDate.toISOString().split("T")[0] === filterStr;
      });
  }

  const handleClearFilter = () => {
      setFilteredDate(null);
      navigate('/app');
  };

  return (
    <DiaryList
        entries={entriesToShow}
        onThisDayEntries={onThisDayEntries}
        onSelectEntry={() => { /* Navigation handled by Link in DiaryList now */ }}
        onLoadContent={loadEntryContent}
        profile={profile}
        filteredDate={filteredDate}
        onClearFilter={handleClearFilter}
    />
  );
};

export default Timeline;