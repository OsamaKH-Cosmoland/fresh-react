export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("NaturaGloss service worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
