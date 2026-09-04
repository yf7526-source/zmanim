import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function wrapFocusIndex(index, length) {
  if (!length) return -1;
  return ((index % length) + length) % length;
}

export default function useFocusTrap(open, onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const previous = document.activeElement;
    const focusable = () => [...ref.current.querySelectorAll(FOCUSABLE)];
    focusable()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current?.();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const current = items.indexOf(document.activeElement);
      const next = wrapFocusIndex(current + (event.shiftKey ? -1 : 1), items.length);
      event.preventDefault();
      items[next].focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open]);

  return ref;
}