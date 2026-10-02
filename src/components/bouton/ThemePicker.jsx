import { useEffect, useState } from "react";

const THEMES = [
  { id: "default", label: "Classique", swatch: "oklch(0.7 0.17 124)" },
  { id: "ocean", label: "Océan", swatch: "oklch(0.55 0.18 240)" },
  { id: "sunset", label: "Coucher de soleil", swatch: "oklch(0.62 0.19 35)" },
];

function ThemePicker() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "default";
    return localStorage.getItem("colorTheme") || "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "default") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
    localStorage.setItem("colorTheme", theme);
  }, [theme]);

  return (
    <div className="flex items-center gap-3">
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-label={t.label}
            aria-pressed={active}
            className={`press w-9 h-9 rounded-full shrink-0 ${active ? "ring-2 ring-offset-2 ring-foreground ring-offset-card" : ""}`}
            style={{ background: t.swatch }}
          />
        );
      })}
    </div>
  );
}

export default ThemePicker;
