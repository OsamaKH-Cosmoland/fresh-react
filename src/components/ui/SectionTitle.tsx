import React from "react";

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionTitle({ title, subtitle, align = "left", className = "" }: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <header className={className}>
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
