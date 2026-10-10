import React, { useEffect, useState } from 'react';
import DiaryEntryView from '../components/DiaryEntryView';
import ConfirmationModal from '../components/ConfirmationModal';
import { useDiary } from '../DiaryLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { DiaryEntry } from '../types';

const EntryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { entries, loadEntryContent, deleteEntry, loading } = useDiary();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    if (id && entries.length > 0) {
        const found = entries.find(e => e.id === id);
        if (found) {
            setEntry(found);
            if (!found.isDecrypted && !found.isLoading) {
                loadEntryContent(id);
            }
        }
    }
  }, [id, entries, loadEntryContent]);

  const currentIndex = entries.findIndex(e => e.id === id);

  // Next means moving forward in time (newer). Since entries are sorted newest first, newer is index - 1.
  const hasNext = currentIndex > 0;
  const hasPrev = currentIndex !== -1 && currentIndex < entries.length - 1;

  const nextEntryId = hasNext ? entries[currentIndex - 1].id : null;
  const prevEntryId = hasPrev ? entries[currentIndex + 1].id : null;

  const handleNext = () => {
    if (nextEntryId) {
      setAnimationClass('animate-slide-out-left');
      setTimeout(() => {
        setAnimationClass('animate-slide-in-right');
        navigate(`/app/entry/${nextEntryId}`);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (prevEntryId) {
      setAnimationClass('animate-slide-out-right');
      setTimeout(() => {
        setAnimationClass('animate-slide-in-left');
        navigate(`/app/entry/${prevEntryId}`);
      }, 200);
    }
  };

  const handleDeleteConfirm = async () => {
      if (!entry) return;
      setIsDeleting(true);
      try {
          await deleteEntry(entry.id);
          // deleteEntry in DiaryLayout handles toast and navigation
      } catch (e) {
          setIsDeleting(false);
      }
  };

  if (loading) return <p className="text-center p-8 text-slate-500">Loading entry...</p>;
  if (!entry) return <p className="text-center p-8 text-slate-500">Entry not found.</p>;

  return (
    <>
        <DiaryEntryView
            entry={entry}
            onEdit={() => navigate(`/app/edit/${entry.id}`)}
            onDelete={() => setIsDeleteModalOpen(true)}
            onBack={() => navigate('/app')}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={hasNext}
            hasPrev={hasPrev}
            animationClass={animationClass}
        />
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            isProcessing={isDeleting}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Entry?"
            message="Are you sure you want to permanently delete this entry? This action cannot be undone."
        />
    </>
  );
};

export default EntryDetail;
