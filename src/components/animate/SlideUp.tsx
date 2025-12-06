import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { ANIMATION_DEFAULTS } from "./config";

export interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  rootMargin?: string;
  threshold?: number | number[];
  style?: CSSProperties;
}

export function SlideUp({
  children,
  className,
  delay = ANIMATION_DEFAULTS.fadeDelay,
  duration = ANIMATION_DEFAULTS.duration,
  rootMargin = "0px",
  threshold = 0.15,
  style,
}: AnimationProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });
  const prefersReducedMotion = usePrefersReducedMotion();

  const animationDuration = prefersReducedMotion ? 0 : duration;
  const animationDelay = prefersReducedMotion ? 0 : delay;

  const transition = prefersReducedMotion
    ? undefined
    : `opacity ${animationDuration}s ${ANIMATION_DEFAULTS.easing} ${animationDelay}s, transform ${animationDuration}s ${ANIMATION_DEFAULTS.easing} ${animationDelay}s`;

  const combinedStyle: CSSProperties = {
    opacity: prefersReducedMotion ? 1 : inView ? 1 : 0,
    transform: prefersReducedMotion
      ? "translateY(0)"
      : inView
        ? "translateY(0)"
        : `translateY(${ANIMATION_DEFAULTS.slideDistance}px)`,
    transition,
    willChange: prefersReducedMotion ? undefined : "opacity, transform",
    ...style,
  };

  return (
    <div ref={ref} className={className} style={combinedStyle}>
      {children}
    </div>
  );
}
