import React from "react";

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  containerClassName?: string;
}

export function InputField({
  label,
  name,
  error,
  containerClassName = "",
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className={["flex flex-col gap-1", containerClassName].filter(Boolean).join(" ")}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        className={[
          "rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-gray-900 focus:ring-emerald-300 focus:border-emerald-300",
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
