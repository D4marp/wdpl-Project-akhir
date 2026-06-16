import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Keuangan UMKM",
  description: "Dashboard operasional pencatatan keuangan UMKM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <body className="min-h-svh antialiased">
        <TooltipProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "18.75rem",
                "--header-height": "4rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset className="min-w-0 overflow-hidden bg-transparent">
              <SiteHeader />
              <div className="relative flex min-w-0 flex-1 flex-col">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.16),transparent_34rem),radial-gradient(circle_at_78%_10%,rgba(14,165,233,0.16),transparent_30rem),linear-gradient(135deg,rgba(59,130,246,0.08),rgba(168,85,247,0.08),rgba(45,212,191,0.08))]" />
                <div className="@container/main relative flex min-w-0 flex-1 flex-col gap-4 p-4 md:gap-6 md:p-7 xl:p-8">
                  {children}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}

