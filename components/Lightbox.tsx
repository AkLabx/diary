import React, { useEffect, useRef } from 'react';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingProgrammaticallyRef = useRef(false);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (src) {
      if (!dialog.open) {
        closingProgrammaticallyRef.current = false;
        dialog.showModal();
      }
    } else if (dialog.open) {
      closingProgrammaticallyRef.current = true;
      dialog.close();
    }
  }, [src]);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Expanded image view"
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (closingProgrammaticallyRef.current) {
          closingProgrammaticallyRef.current = false;
          return;
        }
        if (src) {
          onClose();
        }
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isOutsideDialog(e);
      }}
      onPointerUp={(e) => {
        if (!('closedBy' in HTMLDialogElement.prototype) && pressedOutsideRef.current && isOutsideDialog(e)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className="m-auto p-0 border-0 bg-transparent backdrop:bg-black/90 backdrop:backdrop-blur-sm max-w-5xl w-fit max-h-[92dvh] overflow-visible animate-fade-in"
    >
      {src && (
        <div className="relative p-2 sm:p-4 flex items-center justify-center">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/85 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/80"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img
            src={src}
            alt="Expanded view"
            className="max-w-[90vw] max-h-[85dvh] object-contain rounded-md shadow-2xl"
          />
        </div>
      )}
    </dialog>
  );
};

export default Lightbox;
