"use client";
import { useEffect, useState } from "react";
import { api, type Notification } from "@/lib/api";
import { SkeletonRow } from "@/components/Skeleton";

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getNotifications()
      .then(setNotifs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
      <p className="text-sm text-gray-500">
        Notifikasi dikirim otomatis oleh{" "}
        <strong>Observer Pattern</strong> setiap kali ada transaksi baru atau
        anggaran terlampaui.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl p-6">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Tidak ada notifikasi
        </div>
      ) : (
        <ul className="space-y-3">
          {notifs.map((n) => (
            <li
              key={n.id}
              className={`bg-white rounded-xl border-l-4 shadow-sm p-4 ${
                n.type === "warning"
                  ? "border-l-orange-400"
                  : "border-l-blue-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-800">
                    {n.type === "warning" ? "⚠️" : "ℹ️"} {n.title}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">{n.message}</p>
                </div>
                <span className="text-xs text-gray-300 whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString("id-ID", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
