import Link from "next/link";

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  buttonLabel?: string;
}

export function ActionCard({
  title,
  description,
  href,
  buttonLabel = "Create →",
}: ActionCardProps) {
  return (
    <div className="flex min-h-[120px] items-center justify-between gap-4 rounded-3xl border border-white/80 bg-transparent p-5 shadow-[inset_0_0_20px_10px_rgba(255,255,255,0.3)]">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-medium text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/80">{description}</p>
      </div>
      <Link
        href={href}
        className="bg-gradient-orange flex shrink-0 mt-6 items-center gap-1.5 rounded-[50px] px-4 py-2 text-sm font-medium text-white transition active:scale-[0.98]"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
