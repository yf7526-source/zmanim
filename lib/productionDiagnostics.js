const MAX_MESSAGE_LENGTH = 500;
let started = false;

function cleanMessage(value) {
  return String(value || 'Unknown error')
    .replace(/https?:\/\/[^\s?#]+[?#][^\s]+/gi, '[url removed]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email removed]')
    .slice(0, MAX_MESSAGE_LENGTH);
}

function safePath() {
  return `${window.location.origin}${window.location.pathname}`;
}

function reportingEndpoint() {
  const candidate = import.meta.env.VITE_ERROR_REPORTING_URL;
  if (!candidate) return null;
  try {
    const url = new URL(candidate, window.location.origin);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function reportProductionError(error, context = {}) {
  const endpoint = reportingEndpoint();
  if (!endpoint || import.meta.env.DEV) return;

  const payload = JSON.stringify({
    type: cleanMessage(context.type || 'client_error'),
    name: cleanMessage(error?.name || 'Error'),
    message: cleanMessage(error?.message || error),
    path: safePath(),
    online: navigator.onLine,
    build: cleanMessage(import.meta.env.VITE_APP_VERSION || 'unknown'),
    occurredAt: new Date().toISOString(),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Error reporting must never create a second app failure.
  }
}

export function startProductionDiagnostics() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('error', (event) => {
    reportProductionError(event.error || event.message, { type: 'window_error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportProductionError(event.reason, { type: 'unhandled_rejection' });
  });
}
