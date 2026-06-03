"use client";
import { useEffect, useState, useCallback } from "react";
import { api, type Transaction } from "@/lib/api";
import { TransactionItem } from "@/components/TransactionItem";
import { SkeletonRow } from "@/components/Skeleton";

const LIMIT = 15;

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({
    type: "income",
    category: "",
    description: "",
    amount: "",
  });

  const load = useCallback(
    (p: number) => {
      setLoading(true);
      api
        .getTransactions(p, LIMIT)
        .then((r) => {
          setTxs(r.data);
          setTotal(r.total);
        })
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    load(page);
  }, [page, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.createTransaction({
        ...form,
        amount: parseFloat(form.amount),
      } as any);
      setMsg({ text: "Transaksi berhasil disimpan", ok: true });
      setForm({ type: "income", category: "", description: "", amount: "" });
      load(1);
      setPage(1);
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
        <h2 className="font-bold text-lg mb-5 text-gray-800">
          Catat Transaksi
        </h2>
        {msg && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              msg.ok
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {msg.ok ? "✅" : "❌"} {msg.text}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Jenis
            </label>
            <div className="flex gap-2 mt-1.5">
              {["income", "expense"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === t
                      ? t === "income"
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "income" ? "Pemasukan" : "Pengeluaran"}
                </button>
              ))}
            </div>
          </div>
          {[
            {
              key: "category",
              label: "Kategori",
              placeholder: "misal: Penjualan, Bahan Baku",
              required: true,
            },
            {
              key: "description",
              label: "Keterangan",
              placeholder: "Opsional",
              required: false,
            },
            {
              key: "amount",
              label: "Nominal (Rp)",
              placeholder: "0",
              required: true,
              type: "number",
            },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
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
          {loading ? (
            [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
          ) : txs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">
              Belum ada data
            </p>
          ) : (
            txs.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
          )}
        </ul>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 font-medium"
            >
              ← Sebelumnya
            </button>
            <span className="text-xs text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-30 font-medium"
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
