
'use client';

import React, { useState, useEffect } from 'react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { XIcon } from '@/components/icons/NavIcons';
import { motion, AnimatePresence } from 'framer-motion';

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
  useScrollLock(isOpen);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div 
            className="w-full max-w-md bg-brand-surface rounded-2xl shadow-2xl p-6 z-10 
                       border border-red-500/20 relative"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(255,80,80,0.05),_transparent_40%)] -z-10 rounded-2xl"></div>
            
            <motion.div 
              className="flex justify-between items-center mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <h2 id="modal-title" className="text-xl font-bold text-brand-text-primary">{title}</h2>
              <motion.button 
                onClick={onClose} 
                className="text-brand-text-secondary hover:text-white transition-colors" 
                aria-label="Close modal"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <XIcon className="w-6 h-6" />
              </motion.button>
            </motion.div>
            
            <motion.p 
              className="text-brand-text-secondary mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {message}
            </motion.p>

            {confirmText && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <p className="text-sm text-brand-text-secondary mb-2">
                  To confirm, please type "<span className="font-bold text-brand-text-primary">{confirmText}</span>" below.
                </p>
                <motion.input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full bg-brand-surface-2 border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoComplete="off"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                />
              </motion.div>
            )}

            <motion.div 
              className="flex justify-end space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: confirmText ? 0.5 : 0.3, duration: 0.3 }}
            >
              <motion.button
                type="button"
                onClick={onClose}
                className="bg-brand-surface-2 border border-brand-border text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-border transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={!isConfirmed}
                className="bg-red-600/90 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors
                           shadow-[0_0_10px_rgba(255,80,80,0.2)] disabled:bg-red-900/50 disabled:cursor-not-allowed"
                whileHover={isConfirmed ? { scale: 1.05 } : {}}
                whileTap={isConfirmed ? { scale: 0.95 } : {}}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Delete
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
