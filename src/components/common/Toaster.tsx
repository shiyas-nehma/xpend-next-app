import React from 'react';
import { useToast } from '@/hooks/useToast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XIcon } from '@/components/icons/NavIcons';
import type { ToastType } from '@/types';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
  error: <XCircleIcon className="w-6 h-6 text-red-400" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-400" />,
  warning: <InformationCircleIcon className="w-6 h-6 text-yellow-400" />,
};

const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-brand-surface border border-brand-border rounded-xl shadow-lg p-4 flex items-start gap-3 animate-toast-in"
        >
          <div className="flex-shrink-0">{icons[toast.type]}</div>
          <div className="flex-grow text-sm text-brand-text-primary">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors flex-shrink-0"
            aria-label="Close notification"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
