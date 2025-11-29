import React from 'react';
import SearchView from '../components/SearchView';
import { useDiary } from '../DiaryLayout';
import { useNavigate } from 'react-router-dom';

const Search: React.FC = () => {
  const { entries } = useDiary();
  const navigate = useNavigate();

  return (
    <SearchView
        entries={entries}
        onSelectEntry={(id) => navigate(`/app/entry/${id}`)}
        onBack={() => navigate('/app')}
    />
  );
};

export default Search;