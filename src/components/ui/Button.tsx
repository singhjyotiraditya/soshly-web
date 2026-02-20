"use client";

import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textSize?: "sm" | "base" | "lg";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-gradient-orange text-white hover:opacity-95 active:opacity-90",
  secondary: "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700",
};

const textSizeStyles = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = "button",
      variant = "primary",
      fullWidth,
      leftIcon,
      rightIcon,
      className = "",
      textSize = "base",
      children,
      disabled,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-[14px] transition disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span
          className={`font-medium text-inherit ${textSizeStyles[textSize]}`}
        >
          {children}
        </span>
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
