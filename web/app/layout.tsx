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
                "--sidebar-width": "17rem",
                "--header-height": "4rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset className="min-w-0 bg-muted/30">
              <SiteHeader />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="@container/main flex min-w-0 flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
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

