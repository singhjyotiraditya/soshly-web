"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { getTransactionsForUser, getBalance } from "@/lib/firestore-wallet";
import { formatDateTime } from "@/lib/format";
import type { Transaction } from "@/types";

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([getBalance(user.uid), getTransactionsForUser(user.uid)])
      .then(([b, t]) => {
        setBalance(b);
        setTransactions(t);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const description = (tx: Transaction) => {
    switch (tx.type) {
      case "signup_bonus":
        return "Welcome bonus";
      case "join_escrow":
        return "Joined experience";
      case "escrow_release":
        return "Host payout";
      case "refund":
        return "Refund";
      default:
        return tx.type;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Soshly
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Wallet
        </h1>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <>
            <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Soshly Coins
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {balance ?? 0}
              </p>
            </div>
            <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Ledger
            </h2>
            {transactions.length === 0 ? (
              <p className="text-zinc-500">No transactions yet.</p>
            ) : (
              <ul className="space-y-2">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {description(tx)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className={
                        tx.amount >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-zinc-900 dark:text-zinc-50"
                      }
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
