import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button style={{
      boxShadow: "var(--shadow-card)",
      background: "var(--color-card)",
    }}
      onClick={() => setIsDark((prev) => !prev)}
      aria-label="Basculer le mode sombre"
      className="press flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-muted transition-colors"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-secondary-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-secondary-foreground" />
      )}
    </button>
  );
}

export default DarkModeToggle;
