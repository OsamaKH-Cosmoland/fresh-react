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
import { CurrencyProvider } from "@/currency/CurrencyProvider";
import { LifecycleProvider } from "@/lifecycle";

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <CurrencyProvider>
        <LocaleProvider>
        <LiveAnnouncerProvider>
          <CartProvider>
            <FavoritesProvider>
              <CompareProvider>
                <LifecycleProvider>
                  <App />
                </LifecycleProvider>
              </CompareProvider>
            </FavoritesProvider>
          </CartProvider>
        </LiveAnnouncerProvider>
        </LocaleProvider>
      </CurrencyProvider>
    </StrictMode>
  );
  initScrollAnimations();
  initParallaxHero();
}

registerServiceWorker();
