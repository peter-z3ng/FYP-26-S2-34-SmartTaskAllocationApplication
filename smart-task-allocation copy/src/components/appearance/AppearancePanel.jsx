"use client";

import { useRef, useState } from "react";
import { useAppearance } from "@/components/appearance/AppearanceContext";

const PRESET_COLORS = [
  "#C7DDEB",
  "#E2E8F0",
  "#0D1E4C",
  "#1E293B",
  "#0F766E",
  "#7C3AED",
  "#B91C1C",
  "#F59E0B",
];

// ~4MB ceiling — data URLs above this tend to blow the localStorage quota.
const MAX_WALLPAPER_BYTES = 4 * 1024 * 1024;

export default function AppearancePanel({ onClose }) {
  const { appearance, setTheme, setBackgroundColor, setWallpaper, setBackgroundType, reset } =
    useAppearance();
  const { theme, background } = appearance;
  const fileInputRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState(background.type === "wallpaper" ? background.wallpaper : "");
  const [notice, setNotice] = useState("");

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_WALLPAPER_BYTES) {
      setNotice("Image is larger than 4MB and may not be saved. Try a smaller file or a URL.");
    } else {
      setNotice("");
    }
    const reader = new FileReader();
    reader.onload = () => setWallpaper(String(reader.result));
    reader.readAsDataURL(file);
  }

  function applyUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    setWallpaper(trimmed);
    setNotice("");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#07183b]/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[28px] border border-white/60 bg-white/70 p-7 shadow-[0_30px_80px_rgba(13,30,76,0.25)] backdrop-blur-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close appearance settings"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#07183b] shadow"
        >
          ×
        </button>

        <h2 className="text-2xl font-black text-[#07183b]">Appearance</h2>
        <p className="mt-1 text-sm text-[#52627a]">
          Personalize your background and theme. Saved on this device.
        </p>

        {/* Theme */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#57708f]">Theme</h3>
          <div className="mt-3 inline-flex rounded-full border border-[#C7DDEB] bg-white/70 p-1">
            {["light", "dark"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                className={`rounded-full px-6 py-2 text-sm font-bold capitalize transition-colors ${
                  theme === option ? "bg-[#0D1E4C] text-white" : "text-[#0A2540] hover:bg-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {theme === "dark" ? (
            <p className="mt-2 text-xs font-medium text-[#94739c]">
              Dark mode styling is coming soon — the preference is saved.
            </p>
          ) : null}
        </section>

        {/* Background type */}
        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#57708f]">Background</h3>
          <div className="mt-3 inline-flex rounded-full border border-[#C7DDEB] bg-white/70 p-1">
            {[
              { value: "solid", label: "Solid color" },
              { value: "wallpaper", label: "Wallpaper" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBackgroundType(option.value)}
                className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
                  background.type === option.value
                    ? "bg-[#0D1E4C] text-white"
                    : "text-[#0A2540] hover:bg-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* Solid color controls */}
        {background.type === "solid" ? (
          <section className="mt-5">
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBackgroundColor(color)}
                  aria-label={`Use ${color}`}
                  className={`h-10 w-10 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
                    background.color.toLowerCase() === color.toLowerCase()
                      ? "border-[#0D1E4C] ring-2 ring-[#0D1E4C]/30"
                      : "border-white/80"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-[#0A2540]">
              Custom color
              <input
                type="color"
                value={background.color}
                onChange={(event) => setBackgroundColor(event.target.value)}
                className="h-10 w-16 cursor-pointer rounded-lg border border-[#C7DDEB] bg-white p-1"
              />
              <span className="font-mono text-xs text-[#52627a]">{background.color}</span>
            </label>
          </section>
        ) : (
          /* Wallpaper controls */
          <section className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#0A2540]">Image URL</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(event) => setUrlDraft(event.target.value)}
                  placeholder="https://images.example.com/wallpaper.jpg"
                  className="h-11 flex-1 rounded-xl border border-[#C7DDEB] bg-white px-4 text-sm text-[#0B1B32] outline-none focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
                />
                <button
                  type="button"
                  onClick={applyUrl}
                  className="h-11 rounded-xl bg-[#0a2a66] px-5 text-sm font-bold text-white hover:bg-[#061a40]"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#C7DDEB]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">or</span>
              <span className="h-px flex-1 bg-[#C7DDEB]" />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#83A6CE] bg-white/50 py-4 text-sm font-bold text-[#0A2540] hover:bg-white"
            >
              Upload from device
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />

            {background.wallpaper ? (
              <div
                className="h-24 w-full rounded-xl border border-white/60 bg-cover bg-center shadow-inner"
                style={{ backgroundImage: `url("${background.wallpaper}")` }}
              />
            ) : null}

            {notice ? <p className="text-xs font-medium text-[#b45309]">{notice}</p> : null}
          </section>
        )}

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-[#52627a] hover:text-[#0A2540] hover:underline"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#0D1E4C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0B1B32]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
