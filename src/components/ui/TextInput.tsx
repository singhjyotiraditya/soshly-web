"use client";

import { forwardRef } from "react";

type BaseProps = {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  prefix?: string;
  inputClassName?: string;
};

export type TextInputProps = BaseProps &
  (
    | (Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
        multiline?: false;
      })
    | (Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
        multiline: true;
      })
  );

const TextInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextInputProps
>(
  (
    {
      label,
      error,
      rightIcon,
      prefix,
      inputClassName = "",
      id,
      multiline,
      ...rest
    },
    ref
  ) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const inputClasses = `h-full w-full min-w-0 resize-none border-0 bg-transparent py-2 text-white placeholder-white/60 outline-none transition focus:ring-0 ${
      prefix ? "pl-2" : "pl-4"
    } ${rightIcon ? "pr-11" : "pr-4"} ${inputClassName}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-white/90"
          >
            {label}
          </label>
        )}
        <div
          className={`relative flex w-full rounded-[15px] border bg-clip-padding bg-white/20 backdrop-blur-sm backdrop-filter transition-colors ${
            multiline ? "items-start" : "items-center h-full"
          } ${error ? "border-red-400" : "border-gray-100"}`}
        >
          {prefix && (
            <span className="pointer-events-none shrink-0 pl-4 pt-2 text-white/90">
              {prefix + " "}
            </span>
          )}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              className={inputClasses}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              className={inputClasses}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-300">{error}</p>}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
