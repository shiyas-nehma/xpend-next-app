
'use client';

import React, { useState, useEffect } from 'react';
import { XIcon } from '../icons/NavIcons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText }) => {
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isConfirmed = !confirmText || confirmInput.toLowerCase() === confirmText.toLowerCase();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-md bg-brand-surface rounded-2xl shadow-2xl p-6 z-10 
                   border border-transparent 
                   [background:linear-gradient(theme(colors.brand.surface),theme(colors.brand.surface))_padding-box,linear-gradient(120deg,theme(colors.brand.border),theme(colors.brand.border)_50%,rgba(255,80,80,0.5))_border-box]
                   relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_40%)] -z-10"></div>
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-bold text-brand-text-primary">{title}</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-brand-text-secondary mb-6">{message}</p>

        {confirmText && (
          <div className="mb-4">
              <p className="text-sm text-brand-text-secondary mb-2">
                  To confirm, please type "<span className="font-bold text-brand-text-primary">{confirmText}</span>" below.
              </p>
              <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoComplete="off"
              />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="bg-red-600/90 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors
                       shadow-[0_0_10px_rgba(255,80,80,0.2)] disabled:bg-red-900/50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
