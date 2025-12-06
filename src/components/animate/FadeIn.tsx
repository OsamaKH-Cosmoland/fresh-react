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

export function FadeIn({
  children,
  className,
  delay = ANIMATION_DEFAULTS.fadeDelay,
  duration = ANIMATION_DEFAULTS.duration,
  rootMargin = "0px",
  threshold = 0.2,
  style,
}: AnimationProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });
  const prefersReducedMotion = usePrefersReducedMotion();

  const animationDuration = prefersReducedMotion ? 0 : duration;
  const animationDelay = prefersReducedMotion ? 0 : delay;

  const transition = prefersReducedMotion
    ? undefined
    : `opacity ${animationDuration}s ${ANIMATION_DEFAULTS.easing} ${animationDelay}s`;

  const combinedStyle: CSSProperties = {
    opacity: prefersReducedMotion ? 1 : inView ? 1 : 0,
    transition,
    willChange: prefersReducedMotion ? undefined : "opacity",
    ...style,
  };

  return (
    <div ref={ref} className={className} style={combinedStyle}>
      {children}
    </div>
  );
}
