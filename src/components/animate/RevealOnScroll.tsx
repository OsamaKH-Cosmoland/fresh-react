import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

export interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  rootMargin?: string;
  threshold?: number | number[];
  style?: CSSProperties;
}

const DEFAULT_DURATION = 0.7;

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  duration = DEFAULT_DURATION,
  rootMargin = "0px",
  threshold = 0.2,
  style,
}: RevealOnScrollProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin, threshold });
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (inView && !hasRevealed) {
      setHasRevealed(true);
    }
  }, [inView, hasRevealed]);

  const visible = hasRevealed;
  const transition = `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`;

  const combinedStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
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
