# Web Reference: Next.js 14 App Router
# Kode lengkap — skeleton loading, error handling, Recharts trend chart

---

## Struktur Folder

```
web/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                    ← Dashboard
│   ├── transactions/
│   │   └── page.tsx               ← Form + riwayat + pagination
│   ├── reports/
│   │   └── page.tsx               ← Laporan + BarChart + LineChart
│   └── notifications/
│       └── page.tsx               ← List notifikasi
├── components/
│   ├── Skeleton.tsx               ← ★ NEW: skeleton loading
│   ├── SummaryCard.tsx
│   └── TransactionItem.tsx
├── lib/
│   └── api.ts                     ← fetch client terpusat
├── .env.example
├── Dockerfile
├── next.config.js
└── README.md
```

---

## `package.json`

```json
{
  "name": "umkm-finance-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

---

## `lib/api.ts`

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TENANT = process.env.NEXT_PUBLIC_TENANT_ID ?? "tenant-001";

const h = { "Content-Type": "application/json", "X-Tenant-ID": TENANT };

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: h });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request gagal");
  }
  return res.json();
}

export type Summary      = { income: number; expense: number; balance: number };
export type Transaction  = { id: number; type: string; category: string; description: string; amount: number; created_at: string };
export type Budget       = { id: number; category: string; limit_amount: number; spent_amount: number };
export type Notification = { id: number; title: string; message: string; type: string; created_at: string };
export type ReportData   = { period: string; total_income: number; total_expense: number; balance: number; transactions: Transaction[]; generated_at: string };
export type ListResp<T>  = { data: T[]; total: number; page: number; limit: number };

export const api = {
  getSummary:       ()                         => req<{ data: Summary }>("/api/transactions/summary").then(r => r.data),
  getTransactions:  (page = 1, limit = 20)     => req<ListResp<Transaction>>(`/api/transactions?page=${page}&limit=${limit}`),
  createTransaction:(body: Omit<Transaction,"id"|"created_at">) =>
    req<{ message: string; data: Transaction }>("/api/transactions", { method:"POST", body: JSON.stringify(body) }),
  getReport:        (period = "monthly")        => req<{ data: ReportData }>(`/api/reports?period=${period}`).then(r => r.data),
  getBudgets:       ()                          => req<{ data: Budget[] }>("/api/budgets").then(r => r.data),
  getNotifications: ()                          => req<{ data: Notification[] }>("/api/notifications").then(r => r.data),
};
```

---

## `components/Skeleton.tsx`  ★ NEW

```tsx
// Skeleton loading — tampil saat data belum selesai di-fetch
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
    </div>
  );
}

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1,2,3].map(i => <SkeletonCard key={i} className="h-24" />)}
    </div>
  );
}
```

---

## `components/SummaryCard.tsx`

```tsx
const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const colors: Record<string, string> = {
  blue:  "from-blue-600 to-blue-700",
  green: "from-green-500 to-green-600",
  red:   "from-red-500 to-red-600",
};

export function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-5 shadow-md`}>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{IDR(value)}</p>
    </div>
  );
}
```

---

## `components/TransactionItem.tsx`

```tsx
const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

export function TransactionItem({ tx }: { tx: any }) {
  const isIncome = tx.type === "income";
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm
        ${isIncome ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
        {isIncome ? "↓" : "↑"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{tx.category}</p>
        <p className="text-xs text-gray-400 truncate">{tx.description || "—"}</p>
      </div>
      <span className={`text-sm font-semibold ${isIncome ? "text-green-600" : "text-red-600"}`}>
        {isIncome ? "+" : "-"}{IDR(tx.amount)}
      </span>
    </li>
  );
}
```

---

## `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { @apply bg-slate-50 text-gray-900; }
```

---

## `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Keuangan UMKM", description: "Pencatatan Keuangan UMKM" };

const navLinks = [
  { href: "/",              label: "Dashboard"  },
  { href: "/transactions",  label: "Transaksi"  },
  { href: "/reports",       label: "Laporan"    },
  { href: "/notifications", label: "Notifikasi" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <span className="font-bold text-blue-600 text-lg mr-2">💰 UMKM</span>
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

---

## `app/page.tsx` — Dashboard

```tsx
"use client";
import { useEffect, useState } from "react";
import { api, type Summary, type Transaction } from "@/lib/api";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionItem } from "@/components/TransactionItem";
import { SkeletonSummary, SkeletonRow } from "@/components/Skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [recent, setRecent]         = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTransactions(1, 8)])
      .then(([s, t]) => { setSummary(s); setRecent(t.data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ⚠️ {error} — pastikan backend berjalan di {process.env.NEXT_PUBLIC_API_URL}
        </div>
      )}

      {/* Kartu ringkasan */}
      {loading ? <SkeletonSummary /> : summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Saldo"       value={summary.balance}  color="blue"  />
          <SummaryCard label="Pemasukan"   value={summary.income}   color="green" />
          <SummaryCard label="Pengeluaran" value={summary.expense}  color="red"   />
        </div>
      )}

      {/* Transaksi terbaru */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-blue-600 text-sm hover:underline">
            Lihat semua →
          </Link>
        </div>
        {loading ? (
          <ul>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</ul>
        ) : recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

## `app/transactions/page.tsx`

```tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { api, type Transaction } from "@/lib/api";
import { TransactionItem } from "@/components/TransactionItem";
import { SkeletonRow } from "@/components/Skeleton";

const LIMIT = 15;

export default function TransactionsPage() {
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{text:string; ok:boolean} | null>(null);
  const [form, setForm]       = useState({ type:"income", category:"", description:"", amount:"" });

  const load = useCallback((p: number) => {
    setLoading(true);
    api.getTransactions(p, LIMIT)
      .then(r => { setTxs(r.data); setTotal(r.total); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.createTransaction({ ...form, amount: parseFloat(form.amount) } as any);
      setMsg({ text: "Transaksi berhasil disimpan", ok: true });
      setForm({ type:"income", category:"", description:"", amount:"" });
      load(1); setPage(1);
    } catch (err: any) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-lg mb-5 text-gray-800">Catat Transaksi</h2>
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.ok
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.ok ? "✅" : "❌"} {msg.text}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jenis</label>
            <div className="flex gap-2 mt-1.5">
              {["income","expense"].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({...f, type:t}))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === t
                      ? t === "income"
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}>
                  {t === "income" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>
          </div>
          {[
            { key:"category",    label:"Kategori",     placeholder:"misal: Penjualan, Bahan Baku", required:true  },
            { key:"description", label:"Keterangan",   placeholder:"Opsional",                     required:false },
            { key:"amount",      label:"Nominal (Rp)", placeholder:"0",                            required:true, type:"number" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{f.label}</label>
              <input
                type={f.type ?? "text"} required={f.required} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({...prev, [f.key]: e.target.value}))}
                className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </div>

      {/* List + Pagination */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Riwayat</h2>
          <span className="text-xs text-gray-400">{total} transaksi</span>
        </div>
        <ul className="divide-y divide-gray-50 flex-1">
          {loading
            ? [...Array(6)].map((_,i) => <SkeletonRow key={i} />)
            : txs.length === 0
              ? <p className="text-gray-400 text-sm text-center py-12">Belum ada data</p>
              : txs.map(tx => <TransactionItem key={tx.id} tx={tx} />)
          }
        </ul>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 font-medium">
              ← Sebelumnya
            </button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 font-medium">
              Selanjutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## `app/reports/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { api, type ReportData } from "@/lib/api";
import { SummaryCard } from "@/components/SummaryCard";
import { SkeletonCard } from "@/components/Skeleton";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

export default function ReportsPage() {
  const [period, setPeriod]   = useState("monthly");
  const [report, setReport]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    api.getReport(period)
      .then(setReport)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  // Agregasi per kategori untuk BarChart
  const barData = () => {
    if (!report?.transactions) return [];
    const map: Record<string, {category:string; income:number; expense:number}> = {};
    for (const tx of report.transactions) {
      if (!map[tx.category]) map[tx.category] = { category: tx.category, income:0, expense:0 };
      tx.type === "income" ? (map[tx.category].income += tx.amount) : (map[tx.category].expense += tx.amount);
    }
    return Object.values(map);
  };

  // Agregasi per tanggal untuk LineChart (trend)
  const lineData = () => {
    if (!report?.transactions) return [];
    const map: Record<string, {date:string; income:number; expense:number}> = {};
    for (const tx of report.transactions) {
      const date = tx.created_at?.slice(0,10) ?? "";
      if (!map[date]) map[date] = { date, income:0, expense:0 };
      tx.type === "income" ? (map[date].income += tx.amount) : (map[date].expense += tx.amount);
    }
    return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">⚠️ {error}</div>}

      {/* Kartu ringkasan */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <SkeletonCard key={i} className="h-24" />)}
        </div>
      ) : report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Pemasukan"   value={report.total_income}  color="green" />
          <SummaryCard label="Pengeluaran" value={report.total_expense} color="red"   />
          <SummaryCard label="Saldo"       value={report.balance}       color="blue"  />
        </div>
      )}

      {/* Bar Chart — per kategori */}
      {!loading && barData().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Per Kategori</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData()} margin={{ top:4, right:16, left:16, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize:11 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }} />
              <Tooltip formatter={(v:number) => IDR(v)} />
              <Legend />
              <Bar dataKey="income"  name="Pemasukan"   fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Line Chart — trend waktu */}
      {!loading && lineData().length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Tren Waktu</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData()} margin={{ top:4, right:16, left:16, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize:10 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }} />
              <Tooltip formatter={(v:number) => IDR(v)} />
              <Legend />
              <Line type="monotone" dataKey="income"  name="Pemasukan"   stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !report?.transactions?.length && (
        <div className="text-center py-12 text-gray-400">Belum ada data untuk periode ini</div>
      )}
    </div>
  );
}
```

---

## `app/notifications/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { api, type Notification } from "@/lib/api";
import { SkeletonRow } from "@/components/Skeleton";

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.getNotifications()
      .then(setNotifs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
      <p className="text-sm text-gray-500">
        Notifikasi dikirim otomatis oleh <strong>Observer Pattern</strong> setiap kali
        ada transaksi baru atau anggaran terlampaui.
      </p>

      {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">⚠️ {error}</div>}

      {loading ? (
        <div className="bg-white rounded-xl p-6">
          {[...Array(5)].map((_,i) => <SkeletonRow key={i} />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Tidak ada notifikasi</div>
      ) : (
        <ul className="space-y-3">
          {notifs.map(n => (
            <li key={n.id}
              className={`bg-white rounded-xl border-l-4 shadow-sm p-4 ${
                n.type === "warning" ? "border-l-orange-400" : "border-l-blue-400"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {n.type === "warning" ? "⚠️" : "ℹ️"} {n.title}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">{n.message}</p>
                </div>
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString("id-ID", { dateStyle:"short", timeStyle:"short" })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## `.env.example`

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_TENANT_ID=tenant-001
```

---

## `next.config.js`

```js
/** @type {import('next').NextConfig} */
module.exports = { output: "standalone" };
```

---

## `Dockerfile`

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## `README.md`

```markdown
# UMKM Finance — Web

Next.js 14 App Router dashboard untuk pencatatan keuangan UMKM.

## Prasyarat
- Node.js 20+ dan npm
- Backend berjalan di port 8080

## Jalankan Lokal
```bash
cp .env.example .env.local   # edit API URL jika perlu
npm install
npm run dev
# Buka: http://localhost:3000
```

## Jalankan dengan Docker
```bash
docker build -t umkm-finance-web .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8080 \
  -e NEXT_PUBLIC_TENANT_ID=tenant-001 \
  umkm-finance-web
```

## Fitur
- Dashboard: ringkasan saldo + transaksi terbaru
- Transaksi: form catat + riwayat dengan pagination
- Laporan: BarChart per kategori + LineChart trend waktu
- Notifikasi: list notifikasi dari Observer Pattern
- Skeleton loading di semua halaman
```
