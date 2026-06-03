"use client";
import { useEffect, useState } from "react";
import { api, type Summary, type Transaction } from "@/lib/api";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionItem } from "@/components/TransactionItem";
import { SkeletonSummary, SkeletonRow } from "@/components/Skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTransactions(1, 8)])
      .then(([s, t]) => {
        setSummary(s);
        setRecent(t.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ⚠️ {error} — pastikan backend berjalan di{" "}
          {process.env.NEXT_PUBLIC_API_URL}
        </div>
      )}

      {/* Kartu ringkasan */}
      {loading ? (
        <SkeletonSummary />
      ) : (
        summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Saldo" value={summary.balance} color="blue" />
            <SummaryCard
              label="Pemasukan"
              value={summary.income}
              color="green"
            />
            <SummaryCard
              label="Pengeluaran"
              value={summary.expense}
              color="red"
            />
          </div>
        )
      )}

      {/* Transaksi terbaru */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Transaksi Terbaru</h2>
          <Link
            href="/transactions"
            className="text-blue-600 text-sm hover:underline"
          >
            Lihat semua →
          </Link>
        </div>
        {loading ? (
          <ul>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </ul>
        ) : recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Belum ada transaksi
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
