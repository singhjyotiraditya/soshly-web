const CONTENT_MAX_WIDTH = 504;

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/** Constrains content to max 340px width, centered. Use for onboarding and narrow screens. */
export function BaseLayout({ children, className }: BaseLayoutProps) {
  return (
    <div
      className={["mx-auto w-full", className].filter(Boolean).join(" ")}
      style={{ maxWidth: CONTENT_MAX_WIDTH }}
    >
      {children}
    </div>
  );
}

export { CONTENT_MAX_WIDTH };
