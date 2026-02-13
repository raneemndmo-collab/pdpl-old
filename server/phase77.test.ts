import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const clientDir = path.resolve(__dirname, "../client/src");

describe("Phase 77: Sidebar Hover Effects, Login Page Redesign, Auto Theme Mode", () => {
  
  describe("A. Sidebar Hover Effects", () => {
    it("should have sidebar-nav-item CSS class in index.css", () => {
      const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
      expect(css).toContain("sidebar-nav-item");
    });

    it("should have sidebar hover transition effects in CSS", () => {
      const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
      expect(css).toContain("sidebar-nav-item:hover");
    });

    it("should have sidebar-nav-item-active CSS class", () => {
      const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
      expect(css).toContain("sidebar-nav-item-active");
    });

    it("should have sidebar-group-header CSS class", () => {
      const css = fs.readFileSync(path.join(clientDir, "index.css"), "utf-8");
      expect(css).toContain("sidebar-group-header");
    });

    it("should use sidebar-nav-item class in DashboardLayout", () => {
      const layout = fs.readFileSync(path.join(clientDir, "components/DashboardLayout.tsx"), "utf-8");
      expect(layout).toContain("sidebar-nav-item");
    });
  });

  describe("B. Login Page Redesign", () => {
    it("should have the PlatformLogin page file", () => {
      const loginPath = path.join(clientDir, "pages/PlatformLogin.tsx");
      expect(fs.existsSync(loginPath)).toBe(true);
    });

    it("should have two-column layout with character panel", () => {
      const login = fs.readFileSync(path.join(clientDir, "pages/PlatformLogin.tsx"), "utf-8");
      // Should have character panel section
      expect(login).toContain("LEFT PANEL: Character");
    });

    it("should have Rasid character image in login page", () => {
      const login = fs.readFileSync(path.join(clientDir, "pages/PlatformLogin.tsx"), "utf-8");
      expect(login).toContain("RASID_CHARACTER");
    });

    it("should have ParticleBackground component", () => {
      const login = fs.readFileSync(path.join(clientDir, "pages/PlatformLogin.tsx"), "utf-8");
      expect(login).toContain("ParticleBackground");
    });

    it("should have both light and dark logo variants", () => {
      const login = fs.readFileSync(path.join(clientDir, "pages/PlatformLogin.tsx"), "utf-8");
      expect(login).toContain("RASID_LOGO_LIGHT");
      expect(login).toContain("RASID_LOGO_DARK");
    });

    it("should have Monitor icon import for auto theme mode", () => {
      const login = fs.readFileSync(path.join(clientDir, "pages/PlatformLogin.tsx"), "utf-8");
      expect(login).toContain("Monitor");
    });
  });

  describe("C. Auto Theme Mode (prefers-color-scheme)", () => {
    it("should export ThemeMode type with auto option in ThemeContext", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain('"auto"');
    });

    it("should have themeMode in ThemeContextType interface", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain("themeMode: ThemeMode");
    });

    it("should have setThemeMode in ThemeContextType interface", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain("setThemeMode");
    });

    it("should listen for prefers-color-scheme changes in auto mode", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain("prefers-color-scheme");
      expect(ctx).toContain("addEventListener");
    });

    it("should store themeMode in localStorage", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain('localStorage.setItem("themeMode"');
    });

    it("should have getSystemTheme helper function", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain("getSystemTheme");
    });

    it("should have resolveTheme helper function", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain("resolveTheme");
    });

    it("should toggle through light → dark → auto → light cycle", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      // Check the toggle logic cycles through all 3 modes
      expect(ctx).toContain('if (prev === "light") return "dark"');
      expect(ctx).toContain('if (prev === "dark") return "auto"');
      expect(ctx).toContain('"light"'); // auto → light
    });

    it("should use themeMode in DashboardLayout", () => {
      const layout = fs.readFileSync(path.join(clientDir, "components/DashboardLayout.tsx"), "utf-8");
      expect(layout).toContain("themeMode");
    });

    it("should have Monitor icon in DashboardLayout for auto mode", () => {
      const layout = fs.readFileSync(path.join(clientDir, "components/DashboardLayout.tsx"), "utf-8");
      expect(layout).toContain("Monitor");
      expect(layout).toContain('themeMode === "auto"');
    });

    it("should have green dot indicator for auto mode in DashboardLayout", () => {
      const layout = fs.readFileSync(path.join(clientDir, "components/DashboardLayout.tsx"), "utf-8");
      expect(layout).toContain("bg-green-500");
    });

    it("should migrate from old theme localStorage key", () => {
      const ctx = fs.readFileSync(path.join(clientDir, "contexts/ThemeContext.tsx"), "utf-8");
      expect(ctx).toContain('localStorage.getItem("theme")');
    });
  });
});
