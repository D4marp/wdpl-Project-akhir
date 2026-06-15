"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRingIcon,
  BookOpenTextIcon,
  ChartColumnBigIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  LandmarkIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboardIcon,
    match: ["/"],
  },
  {
    title: "Transaksi",
    href: "/transactions",
    icon: LandmarkIcon,
    match: ["/transactions"],
  },
  {
    title: "Laporan",
    href: "/reports",
    icon: ChartColumnBigIcon,
    match: ["/reports"],
  },
  {
    title: "Notifikasi",
    href: "/notifications",
    icon: BellRingIcon,
    match: ["/notifications"],
  },
] as const;

const secondaryItems = [
  {
    title: "Backend API",
    href: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
    icon: BookOpenTextIcon,
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              isActive
              render={<Link href="/" />}
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-background/15">
                <LandmarkIcon />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">UMKM Finance</span>
                <span className="truncate text-xs text-sidebar-primary-foreground/80">
                  Dashboard operasional harian
                </span>
              </div>
              <ChevronRightIcon className="opacity-70" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} currentPath={pathname} />
        <SidebarGroup>
          <SidebarGroupLabel>Ringkas</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 text-sm">
              <p className="font-medium text-sidebar-foreground">Tenant aktif</p>
              <p className="mt-1 text-sidebar-foreground/70">tenant-001</p>
              <p className="mt-3 text-xs text-sidebar-foreground/65">
                Semua request frontend tetap mengirim `X-Tenant-ID` ke backend.
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
