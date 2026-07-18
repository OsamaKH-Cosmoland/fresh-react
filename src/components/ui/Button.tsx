import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "primary-btn",
  secondary: "cta-btn",
  ghost: "ghost-btn",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "btn-size-sm",
  md: "btn-size-md",
  lg: "btn-size-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = variants[variant] ?? variants.primary;
  const sizeClass = sizes[size] ?? sizes.md;

  const glowClass = variant === "primary" ? "button-glow" : "";

  return (
    <button
      className={[
        variantClass,
        sizeClass,
        glowClass,
        fullWidth ? "btn-full-width" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      {...props}
    />
  );
}
