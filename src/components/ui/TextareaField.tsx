import React from "react";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
  containerClassName?: string;
}

export function TextareaField({
  label,
  name,
  error,
  containerClassName = "",
  className = "",
  ...props
}: TextareaFieldProps) {
  return (
    <div className={["flex flex-col gap-1", containerClassName].filter(Boolean).join(" ")}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        className={[
          "min-h-[120px] rounded-2xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-gray-900 focus:ring-emerald-300 focus:border-emerald-300",
          error ? "border-rose-500" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
