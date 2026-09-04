import React from 'react';
import { reportProductionError } from '@/lib/productionDiagnostics';

/**
 * Last-resort application boundary. LazyChunkErrorBoundary handles stale
 * deploy chunks; this boundary catches ordinary render/lifecycle crashes so
 * users never end up on a blank screen.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Production diagnostics already captures global errors; keep this log
    // concise for local debugging without exposing error details to the UI.
    console.error('SolarZmanim render error', error, info);
    reportProductionError(error, { type: 'react_render_error' });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: '#0D1B2A' }}
      >
        <div className="text-4xl" aria-hidden="true">☀</div>
        <h1 className="text-xl font-semibold text-white">SolarZmanim hit an unexpected error</h1>
        <p className="max-w-md text-sm text-white/70">
          Your saved settings are still on this device. Reload the app to recover.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-xl border border-yellow-400/40 bg-yellow-500/20 px-5 py-2.5 text-sm font-semibold text-yellow-100 transition-all hover:bg-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        >
          Reload SolarZmanim
        </button>
      </div>
    );
  }
}
