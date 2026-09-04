import React from 'react';

/**
 * Error boundary for failed lazy chunk loads (network errors, stale chunks
 * after a deploy, etc.). Reloads the page once so the browser fetches fresh
 * chunks. Matches the app's dark visual theme.
 */
export default class LazyChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Only react to dynamic-import / chunk-loading failures
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /Loading chunk|Failed to fetch dynamically imported module|Loading CSS chunk/i.test(error?.message || '');
    if (!isChunkError) return;
    // Reload once to pick up fresh chunks after a new deploy
    if (!sessionStorage.getItem('chunkReloadAttempted')) {
      sessionStorage.setItem('chunkReloadAttempted', '1');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: '#0D1B2A' }}>
          <div className="text-3xl">☀</div>
          <p className="text-sm text-white/70">Something went wrong loading the page.</p>
          <button
            onClick={() => {
              sessionStorage.removeItem('chunkReloadAttempted');
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-sm font-semibold hover:bg-yellow-500/30 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}