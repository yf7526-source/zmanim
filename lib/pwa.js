async function clearDevelopmentPwaState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) {
    clearDevelopmentPwaState().catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('solarzmanim:update-ready', { detail: { registration } }));
            }
          });
        });
      })
      .catch(() => {
        // Offline support is progressive enhancement; the app remains usable
        // when registration is blocked by a browser or embedding environment.
      });
  }, { once: true });
}

export async function showAppNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall through to the foreground Notification API.
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}