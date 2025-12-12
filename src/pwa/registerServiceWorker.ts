import { getLogger } from "@/logging/globalLogger";

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (import.meta.env.MODE !== "production") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        getLogger().info("NaturaGloss service worker registered", { scope: registration.scope });
      })
      .catch((error) => {
        getLogger().error("Service worker registration failed", { error });
      });
  });
}
