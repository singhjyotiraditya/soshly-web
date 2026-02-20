"use client";

export function Ripple({
  className = "",
  color = "rgba(255, 255, 255, 0.2)",
  size = "1rem",
  duration = 3,
  maxSpread,
}: {
  className?: string;
  color?: string;
  size?: string;
  duration?: number;
  /** Max expansion (e.g. "80vmax" to fill viewport). Default 8rem. */
  maxSpread?: string;
}) {
  const durationSec = `${duration}s`;
  const baseStyle = {
    "--ripple-color": color,
    "--ripple-size": size,
    "--ripple-duration": durationSec,
    ...(maxSpread && { "--ripple-max": maxSpread }),
  } as React.CSSProperties;

  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`ripple-animation absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
          style={
            {
              ...baseStyle,
              "--ripple-delay": `${i}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
