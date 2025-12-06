import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

export interface AnimationPropsF {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  rootMargin?: string;
  threshold?: number | number[];
  style?: CSSProperties;
}

const DEFAULT_DURATION = 0.65;

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  rootMargin = "0px",
  threshold = 0.15,
  style,
}: AnimationPropsF) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });

  const transition = `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`;

  const combinedStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "scale(1)" : "scale(0.96)",
    transition,
    willChange: "opacity, transform",
    ...style,
  };

  return (
    <div ref={ref} className={className} style={combinedStyle}>
      {children}
    </div>
  );
}
