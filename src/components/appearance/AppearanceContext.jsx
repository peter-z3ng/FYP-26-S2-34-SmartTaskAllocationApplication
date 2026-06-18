"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "optima-appearance";
const LIGHT_BACKGROUND = "#C7DDEB";
const DARK_BACKGROUND = "#0F172A";

export const DEFAULT_APPEARANCE = {
  theme: "light",
  background: {
    type: "solid", // "solid" | "wallpaper"
    color: LIGHT_BACKGROUND,
    wallpaper: "", // image URL or data URL
  },
};

const AppearanceContext = createContext(null);

function mergeAppearance(base, override) {
  return {
    ...base,
    ...override,
    background: { ...base.background, ...(override?.background ?? {}) },
  };
}

function loadInitialAppearance() {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? mergeAppearance(DEFAULT_APPEARANCE, JSON.parse(raw)) : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(loadInitialAppearance);
  const hydrated = true;

  // Persist client-side settings after state changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // storage full (e.g. very large wallpaper) or unavailable — ignore
    }
  }, [appearance]);

  // Reflect the theme on <html> so dark-mode styles can hook in later.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = appearance.theme;
    root.classList.toggle("dark", appearance.theme === "dark");
  }, [appearance.theme]);

  const value = useMemo(() => {
    const { background } = appearance;
    const backgroundStyle =
      background.type === "wallpaper" && background.wallpaper
        ? {
            backgroundImage: `url("${background.wallpaper}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }
        : { backgroundColor: background.color };

    return {
      appearance,
      hydrated,
      backgroundStyle,
      setTheme: (theme) =>
        setAppearance((p) => {
          const next = { ...p, theme };
          const isSolid = p.background.type === "solid";
          const currentColor = p.background.color?.toLowerCase();

          if (theme === "dark" && isSolid && currentColor === LIGHT_BACKGROUND.toLowerCase()) {
            next.background = { ...p.background, color: DARK_BACKGROUND };
          } else if (theme === "light" && isSolid && currentColor === DARK_BACKGROUND.toLowerCase()) {
            next.background = { ...p.background, color: LIGHT_BACKGROUND };
          }

          return next;
        }),
      setBackgroundColor: (color) =>
        setAppearance((p) => ({ ...p, background: { ...p.background, type: "solid", color } })),
      setWallpaper: (wallpaper) =>
        setAppearance((p) => ({ ...p, background: { ...p.background, type: "wallpaper", wallpaper } })),
      setBackgroundType: (type) =>
        setAppearance((p) => ({ ...p, background: { ...p.background, type } })),
      reset: () => setAppearance(DEFAULT_APPEARANCE),
    };
  }, [appearance, hydrated]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return ctx;
}
