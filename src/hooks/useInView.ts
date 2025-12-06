import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions extends IntersectionObserverInit {}

export function useInView<T extends Element = HTMLElement>(options?: UseInViewOptions) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const { root, rootMargin, threshold } = options ?? {};

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { root: root ?? null, rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold]);

  return { ref, inView };
}
