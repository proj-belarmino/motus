import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  touched?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      touched,
      type = "text",
      className = "",
      value = "",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;
    const isError = touched && !!error;

    return (
      <div className="relative w-full">
        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            type={inputType}
            value={value}
            placeholder=" "
            className={`
              peer w-full rounded-md border border-border bg-surface px-4 pb-2 pt-6
              text-base text-foreground placeholder-transparent
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
              disabled:cursor-not-allowed disabled:opacity-50
              ${isError ? "border-error ring-1 ring-error" : ""}
              transition-colors duration-200 ease-in-out
              ${className}
            `}
            {...props}
          />
          <label
            htmlFor={id}
            className={`
              pointer-events-none select-none absolute left-4 top-4 origin-[0]
              -translate-y-3 scale-75 transform text-muted duration-150
              peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
              peer-focus:-translate-y-3 peer-focus:scale-75
            `}
          >
            {label}
          </label>

          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-muted hover:text-foreground focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {isError && (
          <div className="mt-1.5 flex items-center space-x-1 text-sm text-error">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
