import { useEffect, useRef } from 'react';

/**
 * Enables click-and-drag scrolling (like touch) on desktop.
 * Returns a ref to attach to the scrollable container.
 */
export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startY = 0;
    let startScroll = 0;

    const onMouseDown = (e) => {
      // Don't hijack clicks on buttons, links, inputs, etc.
      const tag = e.target.tagName;
      if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'].includes(tag)) return;
      isDown = true;
      startY = e.pageY;
      startScroll = el.scrollTop;
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const dy = e.pageY - startY;
      el.scrollTop = startScroll - dy;
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = '';
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return ref;
}