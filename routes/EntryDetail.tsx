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