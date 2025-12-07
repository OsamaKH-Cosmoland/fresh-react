import React from "react";

const ANIMATION_MODES = ["fade-in", "fade-up", "fade-down", "fade-left", "fade-right"] as const;
export type SectionAnimateMode = (typeof ANIMATION_MODES)[number];

export interface SectionTitleProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  animate?: SectionAnimateMode | undefined;
}

export function SectionTitle({
  title,
  subtitle,
  align = "left",
  animate = "fade-up",
  className = "",
  ...props
}: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <header className={className} data-animate={animate} {...props}>
      <h2 className={["text-3xl font-bold tracking-tight text-emerald-900", alignClass].join(" ")}>
        {title}
      </h2>
      {subtitle && (
        <p className={["mt-2 text-sm text-gray-600 max-w-xl", align === "center" ? "mx-auto" : ""].join(" ")}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
