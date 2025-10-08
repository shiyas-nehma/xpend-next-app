'use client';
import { useEffect } from 'react';

/**
 * Locks document body scroll when `active` is true.
 * Handles iOS overscroll and preserves scroll position.
 */
export function useScrollLock(active: boolean, extraSelectors: string[] = []) {
  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const targets: HTMLElement[] = [body];
    extraSelectors.forEach(sel => {
      document.querySelectorAll<HTMLElement>(sel).forEach(el => targets.push(el));
    });

  const original: Array<{ el: HTMLElement; overflow: string; paddingRight: string }>=[];
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    targets.forEach(el => {
      original.push({ el, overflow: el.style.overflow, paddingRight: el.style.paddingRight });
      if (el === body && scrollbarWidth > 0) {
        el.style.paddingRight = `${scrollbarWidth}px`;
      }
      el.style.overflow = 'hidden';
    });
    return () => {
      original.forEach(({ el, overflow, paddingRight }) => {
        // Only revert if element still locked
        if (el.style.overflow === 'hidden') {
          el.style.overflow = overflow;
        }
        if (paddingRight) {
          el.style.paddingRight = paddingRight;
        } else if (el !== document.body) {
          el.style.paddingRight = '';
        }
      });
    };
  }, [active, extraSelectors.join(',')]);
}
