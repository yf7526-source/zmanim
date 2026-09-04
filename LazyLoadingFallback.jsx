import React from 'react';

/**
 * Loading fallback shown while a React.lazy chunk is being fetched.
 * Matches the app's existing dark visual theme (same as AuthenticatedApp's
 * initial loading state) so there's no visual flicker.
 *
 * Accessible: uses role="status" and aria-live="polite" so screen readers
 * announce the loading state without interrupting the user.
 */
export default function LazyLoadingFallback() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: '#0D1B2A' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl" aria-hidden="true">☀</div>
        <div
          className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-400 rounded-full animate-spin"
          aria-hidden="true"
        ></div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}