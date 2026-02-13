import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme?: () => void;
  setThemeMode?: (mode: ThemeMode) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === "auto") return getSystemTheme();
  return mode;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("themeMode");
      if (stored === "light" || stored === "dark" || stored === "auto") {
        return stored;
      }
      // Migrate from old "theme" key
      const oldStored = localStorage.getItem("theme");
      if (oldStored === "light" || oldStored === "dark") {
        return oldStored;
      }
    }
    return defaultTheme;
  });

  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themeMode));

  // Listen for OS color scheme changes when in auto mode
  useEffect(() => {
    if (themeMode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // Update resolved theme when mode changes
  useEffect(() => {
    setTheme(resolveTheme(themeMode));
  }, [themeMode]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("themeMode", themeMode);
      // Keep old key for backward compatibility
      localStorage.setItem("theme", theme);
    }
  }, [theme, themeMode, switchable]);

  // Toggle cycles: light → dark → auto → light
  const toggleTheme = switchable
    ? () => {
        setThemeModeState((prev) => {
          if (prev === "light") return "dark";
          if (prev === "dark") return "auto";
          return "light"; // auto → light
        });
      }
    : undefined;

  const setThemeMode = switchable
    ? (mode: ThemeMode) => {
        setThemeModeState(mode);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
