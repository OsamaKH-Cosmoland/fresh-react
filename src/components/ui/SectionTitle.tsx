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
  const baseClass = ["section-title", align === "center" ? "section-title--center" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={baseClass} data-animate={animate} {...props}>
      <h2 className="section-title__heading">{title}</h2>
      {subtitle && (
        <p className={["section-title__subtitle", align === "center" ? "section-title__subtitle--center" : ""]
          .filter(Boolean)
          .join(" ")}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
