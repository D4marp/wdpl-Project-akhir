import { render } from "@testing-library/react";

import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("dashboard shell layout classes", () => {
  it("uses Tailwind v3-safe shell sizing classes", () => {
    const { container } = render(
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SiteHeader />
        </SidebarProvider>
      </TooltipProvider>
    );

    expect(container.innerHTML).not.toContain("w-(--sidebar-width)");
    expect(container.innerHTML).not.toContain("h-(--header-height)");
    expect(container.innerHTML).not.toContain("origin-(--transform-origin)");
  });
});
