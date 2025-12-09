import React from "react";

const ANIMATION_MODES = ["fade-in", "fade-up", "fade-down", "fade-left", "fade-right"] as const;
export type SectionAnimateMode = (typeof ANIMATION_MODES)[number];
export type SectionTitleLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface SectionTitleProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  animate?: SectionAnimateMode | undefined;
  as?: SectionTitleLevel;
}

export function SectionTitle({
  title,
  subtitle,
  align = "left",
  animate = "fade-up",
  className = "",
  as = "h2",
  ...props
}: SectionTitleProps) {
  const baseClass = ["section-title", align === "center" ? "section-title--center" : "", className]
    .filter(Boolean)
    .join(" ");
  const HeadingTag = as;

  return (
    <header className={baseClass} data-animate={animate} {...props}>
      <HeadingTag className="section-title__heading">{title}</HeadingTag>
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
