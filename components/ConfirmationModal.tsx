import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isProcessing?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
  if (!isOpen) return null;

  // This prevents background scroll when modal is open.
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleConfirm = () => {
    onConfirm();
  };

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4"
        role="document"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            aria-label="Confirm deletion"
          >
            {isProcessing ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                </>
            ) : (
                'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default ConfirmationModal;