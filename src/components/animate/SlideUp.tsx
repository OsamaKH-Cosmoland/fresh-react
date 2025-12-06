import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

export interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  rootMargin?: string;
  threshold?: number | number[];
  style?: CSSProperties;
}

const DEFAULT_DURATION = 0.7;

export function SlideUp({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  rootMargin = "0px",
  threshold = 0.15,
  style,
}: AnimationProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });

  const transition = `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`;

  const combinedStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(24px)",
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
