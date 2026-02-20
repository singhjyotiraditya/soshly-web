"use client";

import { createElement } from "react";

export type TextVariant = "primary" | "secondary" | "micro";

export interface TextProps {
  variant?: TextVariant;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "label";
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
  primary: "text-[22px] font-normal",
  secondary: "text-sm font-light",
  micro: "text-xs font-light",
};

const defaultTag: Record<TextVariant, TextProps["as"]> = {
  primary: "p",
  secondary: "p",
  micro: "span",
};

export function Text({
  variant = "primary",
  as,
  className = "",
  children,
}: TextProps) {
  const tag = as ?? defaultTag[variant] ?? "p";
  const styles = variantStyles[variant];

  return createElement(
    tag,
    { className: `${styles} ${className}`.trim() },
    children
  );
}
