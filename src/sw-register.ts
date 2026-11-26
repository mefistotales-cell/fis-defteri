import { registerSW } from 'virtual:pwa-register';

const UPDATE_INTERVAL_MS = 60_000;

export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const update = () => {
        void registration.update().catch(() => undefined);
      };
      window.setInterval(update, UPDATE_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') update();
      });
    },
  });
}
