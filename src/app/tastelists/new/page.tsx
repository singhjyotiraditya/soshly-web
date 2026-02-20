"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { TextInput } from "@/components/ui/TextInput";
import { createTasteList } from "@/lib/firestore-tastelists";

const SUGGESTED_NAMES = [
  "Cafe Blues",
  "Cute cafe spots",
  "Cafe spoton",
  "Cafe clicks",
  "Cozy Cafe spot",
  "Foodie finds",
  "Hidden gems",
  "Street food hits",
];

export default function NewTasteListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !name.trim()) return;
    setSaving(true);
    try {
      const id = await createTasteList({
        ownerId: user.uid,
        name: name.trim(),
        description: undefined,
        tags: [],
        privacy: "public",
      });
      router.push(`/tastelists/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Create List" backHref="/curate" />

      <main className="mx-auto max-w-md px-4 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <TextInput
              id="name"
              label="Name your List"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Cafe clicks"
              inputClassName="py-4"
            />
            <p className="mt-1.5 text-sm text-white/60">
              e.g. &quot;Cozy Cafe spot&quot;
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/80">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_NAMES.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setName(suggested)}
                  className={`rounded-3xl px-3 py-1.5 text-sm font-medium transition ${
                    name === suggested
                      ? "bg-gradient-orange text-white"
                      : "border border-white/40 bg-white/20 text-white backdrop-blur-xl"
                  }`}
                >
                  {suggested}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full rounded-[16px] bg-black py-4 text-base font-semibold text-white transition disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </form>
      </main>
    </div>
  );
}
