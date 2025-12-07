const HERO_SELECTOR = '[data-parallax="hero"]';
const MAX_OFFSET = 20;
const DESKTOP_FACTOR = 0.045;
const MOBILE_FACTOR = 0.015;

let initialized = false;
let frameId: number | null = null;

const clamp = (value: number) => Math.max(Math.min(value, MAX_OFFSET), -MAX_OFFSET);

const updateTransforms = (elements: HTMLElement[], factor: number) => {
  const translate = clamp(window.scrollY * factor);
  elements.forEach((element) => {
    element.style.transform = `translateY(${translate}px)`;
  });
};

export function initParallaxHero() {
  if (initialized) return;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const elements = Array.from(document.querySelectorAll<HTMLElement>(HERO_SELECTOR));
  if (!elements.length) {
    return;
  }

  initialized = true;

  const mobileQuery = window.matchMedia("(max-width: 640px)");
  const getFactor = () => (mobileQuery.matches ? MOBILE_FACTOR : DESKTOP_FACTOR);

  const onFrame = () => {
    frameId = null;
    updateTransforms(elements, getFactor());
  };

  const handleScroll = () => {
    if (frameId != null) return;
    frameId = window.requestAnimationFrame(onFrame);
  };

  const handleResize = () => {
    if (frameId != null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    updateTransforms(elements, getFactor());
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize);
  updateTransforms(elements, getFactor());

  const teardown = () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
    if (frameId != null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  return teardown;
}
