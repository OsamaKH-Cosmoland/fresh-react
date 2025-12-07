import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { CartProvider } from "./cart/cartStore";
import { initParallaxHero } from "./utils/parallaxHero";
import { initScrollAnimations } from "./utils/scrollAnimations";
import { FavoritesProvider } from "./favorites/favoritesStore";

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <CartProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </CartProvider>
    </StrictMode>
  );
  initScrollAnimations();
  initParallaxHero();
}

registerServiceWorker();
