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

const DEFAULT_DURATION = 0.6;

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  rootMargin = "0px",
  threshold = 0.2,
  style,
}: AnimationProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });

  const transition = `opacity ${duration}s ease ${delay}s`;

  const combinedStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transition,
    willChange: "opacity",
    ...style,
  };

  return (
    <div ref={ref} className={className} style={combinedStyle}>
      {children}
    </div>
  );
}
