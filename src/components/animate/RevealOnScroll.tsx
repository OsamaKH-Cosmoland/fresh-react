import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { ANIMATION_DEFAULTS } from "./config";

export interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  offset?: number | string;
  threshold?: number | number[];
  once?: boolean;
  style?: CSSProperties;
}

export function RevealOnScroll({
  children,
  className,
  delay = ANIMATION_DEFAULTS.fadeDelay,
  duration = ANIMATION_DEFAULTS.duration,
  offset = "0px",
  threshold = 0.2,
  once = true,
  style,
}: RevealOnScrollProps) {
  const rootMargin =
    typeof offset === "number" ? `${offset}px` : offset ?? "0px";
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }
    if (inView) {
      setVisible(true);
      return;
    }
    if (!once) {
      setVisible(false);
    }
  }, [inView, once, prefersReducedMotion]);

  const animationDuration = prefersReducedMotion ? 0 : duration;
  const animationDelay = prefersReducedMotion ? 0 : delay;

  const transition = prefersReducedMotion
    ? undefined
    : `opacity ${animationDuration}s ${ANIMATION_DEFAULTS.easing} ${animationDelay}s, transform ${animationDuration}s ${ANIMATION_DEFAULTS.easing} ${animationDelay}s`;

  const combinedStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
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
