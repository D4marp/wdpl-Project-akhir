"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRingIcon,
  ChartColumnBigIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  LandmarkIcon,
  RocketIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              className="h-16 bg-transparent px-3 text-sidebar-foreground hover:bg-transparent hover:text-sidebar-foreground"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_12px_20px_-12px_hsl(226_83%_57%/0.85)]">
                <LandmarkIcon />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-heading text-base font-semibold">UMKM Finance</span>
                <span className="truncate text-xs text-muted-foreground">Dashboard operasional</span>
              </div>
              <ChevronRightIcon className="text-muted-foreground opacity-70" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} currentPath={pathname} />
        <SidebarGroup>
          <SidebarGroupLabel>Ringkas</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-blue-50 to-sky-50 p-4 text-sm shadow-[0_16px_36px_-30px_hsl(226_83%_57%/0.75)]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <RocketIcon className="size-4" />
              </div>
              <p className="mt-3 font-semibold text-sidebar-foreground">Tenant aktif</p>
              <p className="mt-1 text-sidebar-foreground/70">tenant-001</p>
              <p className="mt-3 text-xs leading-5 text-sidebar-foreground/65">
                Semua request frontend tetap mengirim X-Tenant-ID ke backend.
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
