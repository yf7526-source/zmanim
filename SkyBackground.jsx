import React, { useMemo } from 'react';
import { getSkyColor } from '@/lib/sunCalc';

/**
 * Full-screen animated sky background that shifts with sun altitude.
 */
export default function SkyBackground({ altitude = 0 }) {
  const topColor = useMemo(() => getSkyColor(altitude + 15), [altitude]);
  const midColor = useMemo(() => getSkyColor(altitude + 5), [altitude]);
  const horizonColor = useMemo(() => getSkyColor(altitude), [altitude]);

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-sky"
      style={{
        background: `linear-gradient(180deg, ${topColor} 0%, ${midColor} 50%, ${horizonColor} 100%)`,
        opacity: 0.18,
        zIndex: 0,
      }}
    />
  );
}