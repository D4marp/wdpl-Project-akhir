"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BellIcon, SearchIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard Keuangan",
    subtitle: "Pantau saldo, arus kas, dan transaksi terbaru UMKM.",
  },
  "/transactions": {
    title: "Manajemen Transaksi",
    subtitle: "Catat pemasukan dan pengeluaran, lalu tinjau riwayat terbaru.",
  },
  "/reports": {
    title: "Laporan & Tren",
    subtitle: "Analisis performa pemasukan dan pengeluaran berdasarkan periode.",
  },
  "/notifications": {
    title: "Notifikasi Sistem",
    subtitle: "Lihat notifikasi observer backend terkait transaksi dan anggaran.",
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta["/"];

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center border-b border-border/70 bg-card">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>UMKM Finance</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{meta.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
        </div>
        <div className="hidden h-10 min-w-72 items-center gap-2 rounded-2xl bg-muted/70 px-3 text-sm text-muted-foreground shadow-inner md:flex">
          <SearchIcon className="size-4" />
          <span>Search something...</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/notifications" className="relative flex size-10 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:text-primary hover:shadow-md">
            <BellIcon className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-card" />
          </Link>
        </div>
      </div>
    </header>
  );
}
