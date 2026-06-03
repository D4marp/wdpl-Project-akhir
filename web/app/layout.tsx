import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keuangan UMKM",
  description: "Pencatatan Keuangan UMKM",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transaksi" },
  { href: "/reports", label: "Laporan" },
  { href: "/notifications", label: "Notifikasi" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <span className="font-bold text-blue-600 text-lg mr-2">
              💰 UMKM
            </span>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
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
