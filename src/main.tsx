import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { CartProvider } from "./cart/cartStore";
import { initParallaxHero } from "./utils/parallaxHero";
import { initScrollAnimations } from "./utils/scrollAnimations";
import { FavoritesProvider } from "./favorites/favoritesStore";
import { CompareProvider } from "./compare/compareStore";
import { LocaleProvider } from "@/localization/locale";
import { LiveAnnouncerProvider } from "@/components/accessibility/LiveAnnouncer";

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
    <LocaleProvider>
      <LiveAnnouncerProvider>
        <CartProvider>
          <FavoritesProvider>
            <CompareProvider>
              <App />
            </CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </LiveAnnouncerProvider>
    </LocaleProvider>
    </StrictMode>
  );
  initScrollAnimations();
  initParallaxHero();
}

registerServiceWorker();
