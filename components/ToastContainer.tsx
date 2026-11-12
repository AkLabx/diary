import React from 'react';
import { ToastMessage } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 left-4 right-4 sm:left-auto sm:right-5 sm:w-full max-w-sm z-50 space-y-3 pointer-events-none [&>*]:pointer-events-auto" aria-live="assertive">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
