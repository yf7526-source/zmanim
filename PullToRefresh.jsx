import React, { useState, useRef, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      e.preventDefault?.();
      setPullDistance(Math.min(diff * 0.5, MAX_PULL));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      style={{ overscrollBehavior: 'contain' }}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
          style={{ top: isRefreshing ? THRESHOLD : Math.max(0, pullDistance - 20) }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          ) : (
            <RefreshCw
              className="w-5 h-5 text-yellow-400/60"
              style={{ transform: `rotate(${pullDistance * 3}deg)`, opacity: Math.min(1, pullDistance / THRESHOLD) }}
            />
          )}
        </div>
      )}
      <div
        style={{
          transform: `translateY(${isRefreshing ? THRESHOLD : pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}