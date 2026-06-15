"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  match: readonly string[];
};

export function NavMain({
  items,
  currentPath,
}: {
  items: readonly NavItem[];
  currentPath: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.match.some((match) =>
              match === "/" ? currentPath === "/" : currentPath.startsWith(match)
            );

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
