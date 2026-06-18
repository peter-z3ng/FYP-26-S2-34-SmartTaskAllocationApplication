"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

function ratingStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PublicFeedbackPageContent() {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/public-feedback", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load public feedback.");
        }

        if (active) {
          setFeedbackItems(result.feedback ?? []);
        }
      } catch (feedbackError) {
        if (active) {
          setError(feedbackError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFeedback();

    return () => {
      active = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (feedbackItems.length === 0) return 0;
    return feedbackItems.reduce((total, item) => total + item.rating, 0) / feedbackItems.length;
  }, [feedbackItems]);

  return (
    <main className="optima-feedback-page min-h-screen overflow-hidden bg-[#C7DDEB] text-[#07183b]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-[#07183b]">
        <Link href="/" className="button-lift">
          <BrandLogo dark />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-[#b8c4d8] bg-white px-5 py-3 text-sm font-black text-[#0a2a66] transition hover:bg-[#eef2f8]"
          >
            Back
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#0a2a66] px-5 py-3 text-sm font-black text-white transition hover:bg-[#061a40]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-12 text-[#07183b]">
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-[#83A6CE] bg-[#E0E5E9] px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#57708f]">
              User feedback
            </p>
            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Read every customer review in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52627a]">
              Browse feedback from managers, supervisors, business owners, and operations teams using Optima for task allocation.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#83A6CE] bg-[#E0E5E9] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#52627a]">Average rating</p>
            <p className="mt-2 text-5xl font-black text-[#0a2a66]">
              {loading ? "--" : averageRating.toFixed(1)}/5
            </p>
            <p className="mt-2 text-sm text-[#52627a]">
              {loading ? "Loading published feedback..." : `${feedbackItems.length} published feedback entries`}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        {error ? (
          <article className="mb-5 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700 shadow-sm">
            {error}
          </article>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {loading ? (
            <article className="rounded-[28px] border border-[#83A6CE] bg-[#E0E5E9] p-8 text-center shadow-sm lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#57708f]">Loading</p>
              <h2 className="mt-3 text-2xl font-black text-[#07183b]">Loading published feedback...</h2>
            </article>
          ) : null}

          {!loading && feedbackItems.length === 0 ? (
            <article className="rounded-[28px] border border-[#83A6CE] bg-[#E0E5E9] p-8 text-center shadow-sm lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#57708f]">Moderation queue</p>
              <h2 className="mt-3 text-2xl font-black text-[#07183b]">No published feedback yet.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#52627a]">
                Customer feedback will appear here after Platform Admin reviews and publishes it.
              </p>
            </article>
          ) : null}

          {!loading
            ? feedbackItems.map((item) => (
                <article
                  key={item.id}
                  className="motion-card rounded-[28px] border border-[#83A6CE] bg-[#E0E5E9] p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#57708f]">
                        {item.category}
                      </p>
                      <h2 className="mt-3 text-2xl font-black leading-snug text-[#07183b]">
                        &quot;{item.quote}&quot;
                      </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#BBE1FA] px-3 py-2 text-sm font-black text-[#0a2a66]">
                      {ratingStars(item.rating)}
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-[#52627a]">{item.details}</p>

                  <div className="mt-6 border-t border-[#b8c4d8] pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="font-black text-[#07183b]">{item.name}</p>
                        <p className="mt-1 text-sm text-[#52627a]">
                          {item.role}, {item.company}
                        </p>
                      </div>
                      <time className="text-sm font-semibold text-[#57708f]" dateTime={item.date}>
                        {formatDate(item.date)}
                      </time>
                    </div>
                  </div>
                </article>
              ))
            : null}
        </div>
      </section>
    </main>
  );
}
