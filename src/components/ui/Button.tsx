import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white border-0",
  secondary: "bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-400",
  ghost: "bg-transparent text-gray-800 hover:bg-gray-100 border border-transparent",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
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

  return (
    <button
      className={[
        "rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400",
        variantClass,
        sizeClass,
        fullWidth ? "w-full" : "inline-flex",
        disabled ? "opacity-60 cursor-not-allowed" : "shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      {...props}
    />
  );
}
