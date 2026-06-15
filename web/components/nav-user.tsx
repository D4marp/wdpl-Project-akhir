import { DatabaseZapIcon } from "lucide-react";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="h-auto min-h-12 items-start py-2">
          <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <DatabaseZapIcon />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="font-medium">MySQL + Gin API</span>
            <span className="text-xs text-sidebar-foreground/70">
              Backend tetap menjadi source of truth
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
