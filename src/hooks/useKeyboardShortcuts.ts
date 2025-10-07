import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  callback: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const {
          key,
          ctrl = false,
          alt = false,
          shift = false,
          callback
        } = shortcut;

        const isMatch = 
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrl &&
          event.altKey === alt &&
          event.shiftKey === shift;

        if (isMatch) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

export default useKeyboardShortcuts;