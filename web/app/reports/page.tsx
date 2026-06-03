"use client";
import { useEffect, useState } from "react";
import { api, type ReportData } from "@/lib/api";
import { SummaryCard } from "@/components/SummaryCard";
import { SkeletonCard } from "@/components/Skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getReport(period)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  // Agregasi per kategori untuk BarChart
  const barData = () => {
    if (!report?.transactions) return [];
    const map: Record<
      string,
      { category: string; income: number; expense: number }
    > = {};
    for (const tx of report.transactions) {
      if (!map[tx.category])
        map[tx.category] = { category: tx.category, income: 0, expense: 0 };
      tx.type === "income"
        ? (map[tx.category].income += tx.amount)
        : (map[tx.category].expense += tx.amount);
    }
    return Object.values(map);
  };

  // Agregasi per tanggal untuk LineChart (trend)
  const lineData = () => {
    if (!report?.transactions) return [];
    const map: Record<
      string,
      { date: string; income: number; expense: number }
    > = {};
    for (const tx of report.transactions) {
      const date = tx.created_at?.slice(0, 10) ?? "";
      if (!map[date]) map[date] = { date, income: 0, expense: 0 };
      tx.type === "income"
        ? (map[date].income += tx.amount)
        : (map[date].expense += tx.amount);
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Kartu ringkasan */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
      ) : (
        report && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="Pemasukan"
              value={report.total_income}
              color="green"
            />
            <SummaryCard
              label="Pengeluaran"
              value={report.total_expense}
              color="red"
            />
            <SummaryCard label="Saldo" value={report.balance} color="blue" />
          </div>
        )
      )}

      {/* Bar Chart — per kategori */}
      {!loading && barData().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Per Kategori</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={barData()}
              margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v: number) => IDR(v)} />
              <Legend />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Line Chart — trend waktu */}
      {!loading && lineData().length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Tren Waktu</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={lineData()}
              margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v: number) => IDR(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="Pemasukan"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Pengeluaran"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !report?.transactions?.length && (
        <div className="text-center py-12 text-gray-400">
          Belum ada data untuk periode ini
        </div>
      )}
    </div>
  );
}
