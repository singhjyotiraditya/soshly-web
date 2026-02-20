"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";

const AddPhotoView = dynamic(
  () => import("./AddPhotoView"),
  { ssr: false, loading: () => <AddPhotoPageSkeleton /> }
);

function AddPhotoPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <p className="text-sm text-white/80">Loading…</p>
    </div>
  );
}

export default function AddPhotoPage() {
  const params = useParams();
  const tasteListId = params.id as string;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <Link href={`/tastelists/${tasteListId}`} className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Soshly
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="text-sm text-zinc-500">Set NEXT_PUBLIC_MAPBOX_TOKEN for search.</p>
        </main>
      </div>
    );
  }

  return <AddPhotoView tasteListId={tasteListId} token={token} />;
}
