import fs from "fs";
import path from "path";

describe("shadcn Tailwind v3 theme compatibility", () => {
  const globalsCss = fs.readFileSync(path.join(__dirname, "globals.css"), "utf8");
  const tailwindConfig = fs.readFileSync(path.join(__dirname, "..", "tailwind.config.js"), "utf8");

  it("keeps CSS variables in HSL channel format for Tailwind hsl(var()) colors", () => {
    expect(tailwindConfig).toContain('background: "hsl(var(--background))"');
    expect(tailwindConfig).toContain('foreground: "hsl(var(--destructive-foreground))"');
    expect(globalsCss).not.toMatch(/--[a-z0-9-]+:\s*oklch\(/i);
    expect(globalsCss).toContain("--background: 0 0% 100%;");
    expect(globalsCss).toContain("--sidebar: 0 0% 98%;");
  });
});
