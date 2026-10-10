import React, { useEffect } from 'react';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (src) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in backdrop-blur-sm"
        onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className="relative max-w-5xl max-h-[90vh] w-full p-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent close on image click
      >
        <img
            src={src}
            alt="Expanded view"
            className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
        />
      </div>
    </div>
  );
};

export default Lightbox;
