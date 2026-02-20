import Link from "next/link";
import Image from "next/image";

interface PageHeaderProps {
  title: string;
  backHref: string;
}

export function PageHeader({ title, backHref }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 px-4 pb-2 pt-4">
      <div className="mx-auto flex max-w-md items-center gap-4">
        <Link
          href={backHref}
          className="flex shrink-0 items-center justify-center"
          aria-label="Back"
        >
          <Image
            src="/back.svg"
            alt=""
            width={36}
            height={36}
            className="h-8 w-8"
          />
        </Link>
        <h1 className="flex-1 text-center text-xl font-medium text-white">
          {title}
        </h1>
        <div className="h-10 w-10 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
