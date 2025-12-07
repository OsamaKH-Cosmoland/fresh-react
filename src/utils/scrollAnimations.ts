const ANIMATION_MODES = ["fade-in", "fade-up", "fade-down", "fade-left", "fade-right"] as const;
const VALID_ANIMATION_SET = new Set<string>(ANIMATION_MODES);
const VISIBILITY_CLASS = "is-visible";

let observer: IntersectionObserver | null = null;
let hasInitialized = false;

const getAnimationFromAttribute = (value: string | null) => {
  if (!value) return null;
  const tokens = value.split(/\s+/).map((part) => part.trim()).filter(Boolean);
  return tokens.find((token) => VALID_ANIMATION_SET.has(token)) ?? null;
};

const applyAnimation = (element: Element) => {
  if (!(element instanceof HTMLElement)) return;
  if (element.classList.contains(VISIBILITY_CLASS)) {
    return;
  }
  const animationClass = getAnimationFromAttribute(element.getAttribute("data-animate"));
  if (animationClass) {
    element.classList.add(VISIBILITY_CLASS, animationClass);
    return;
  }
  element.classList.add(VISIBILITY_CLASS);
};

const revealAll = () => {
  document.querySelectorAll<HTMLElement>("[data-animate]").forEach((element) => {
    applyAnimation(element);
  });
};

const startObserver = () => {
  if (hasInitialized) return;
  hasInitialized = true;

  if (typeof IntersectionObserver === "undefined") {
    revealAll();
    return;
  }

  if (observer) {
    return;
  }

  observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        applyAnimation(entry.target);
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.25,
      rootMargin: "0px 0px -12% 0px",
    }
  );

  document.querySelectorAll<HTMLElement>("[data-animate]").forEach((element) => {
    observer?.observe(element);
  });
};

export function initScrollAnimations() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const globalKey = "__NATURA_GLOSS_SCROLL_ANIMATIONS";
  if ((window as Record<string, boolean>)[globalKey]) {
    return;
  }
  (window as Record<string, boolean>)[globalKey] = true;
  document.documentElement.classList.add("anim-js-enabled");

  const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) {
    revealAll();
    return;
  }

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) {
    const handleFirstScroll = () => {
      startObserver();
      window.removeEventListener("scroll", handleFirstScroll);
    };
    window.addEventListener("scroll", handleFirstScroll, { passive: true });
  } else {
    startObserver();
  }
}
