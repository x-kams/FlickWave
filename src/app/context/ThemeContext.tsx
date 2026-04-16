import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Apply class to <html> — called on every change
function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try { localStorage.setItem("flickwave-theme", dark ? "dark" : "light"); } catch { /**/ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    // Read from localStorage — index.html script already applied the class,
    // so state and DOM are in sync from the very first render.
    try {
      return localStorage.getItem("flickwave-theme") === "dark";
    } catch {
      return false;
    }
  });

  // Keep DOM in sync whenever state changes
  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}