"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function ratingStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return "★".repeat(value) + "☆".repeat(5 - value);
}

export default function PublicFeedbackStrip({ embedded = false }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/public-feedback?limit=3", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load public feedback.");
        }

        if (active) {
          setFeedback(result.feedback ?? []);
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

  const content = (
    <>
      {!embedded ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b897d8]">Published feedback</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal text-white md:text-4xl">
              Customer comments approved by Platform Admin
            </h2>
          </div>
          <Link
            href="/feedback"
            className="inline-flex w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white/85 transition hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/10"
          >
            View all reviews
          </Link>
        </div>
      ) : null}

      {error ? <p className="mt-5 rounded-2xl bg-rose-400/15 p-4 text-sm font-bold text-rose-100">{error}</p> : null}

      <div className={`${embedded ? "mt-12 lg:grid-cols-3" : "mt-6 md:grid-cols-3"} grid gap-4`}>
        {loading ? (
          <article className={`${embedded ? "rounded-lg" : "rounded-[24px]"} border border-white/10 bg-white/[0.06] p-5 text-sm font-bold text-white/70 md:col-span-3`}>
            Loading moderated feedback...
          </article>
        ) : null}

        {!loading && feedback.length === 0 ? (
          <article className={`${embedded ? "rounded-lg" : "rounded-[24px]"} border border-white/10 bg-white/[0.06] p-5 text-sm leading-7 text-white/70 md:col-span-3`}>
            Public feedback will appear here after the Platform Admin reviews and publishes customer submissions.
          </article>
        ) : null}

        {feedback.map((item) => (
          <article
            key={item.id}
            className={`motion-card border border-white/10 bg-white/[0.06] p-6 ${embedded ? "rounded-lg" : "rounded-[24px] bg-[#071428]/76"}`}
          >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">{item.category}</p>
                <span className="rounded-full bg-blue-400/18 px-3 py-1 text-xs font-black text-blue-100">
                  {ratingStars(item.rating)}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-black leading-snug text-white">&quot;{item.quote}&quot;</h3>
              <p className="mt-4 text-sm leading-7 text-blue-100/72">{item.details}</p>
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="font-black text-white">{item.name}</p>
                <p className="mt-1 text-sm text-blue-100/62">
                  {item.role}, {item.company}
                </p>
              </div>
            </article>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
        {content}
      </div>
    </section>
  );
}
