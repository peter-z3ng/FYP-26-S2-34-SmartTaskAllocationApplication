"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PublicFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/workflow-feedback?scope=public");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load public feedback.");
        }

        setFeedback(result.feedback ?? []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <main className="min-h-screen bg-[#EEF5FA] px-4 py-6 text-[#07183b] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-white bg-white/70 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black text-[#07183b]">
            OPTIMA
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold text-[#0A2540]">
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/guest/marketing">Marketing</Link>
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/guest/features">Features</Link>
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/guest/pricing">Pricing</Link>
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/guest/contact">Support</Link>
          </nav>
        </header>

        <section className="rounded-2xl border border-[#BBE1FA] bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">4.7.4 Guest</p>
          <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">User Feedback Page</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
            Feedback shown here has been reviewed by Platform Admin. Hidden feedback remains internal.
          </p>

          {error ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          {isLoading ? <p className="mt-6 text-sm font-semibold text-[#52627a]">Loading approved feedback...</p> : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {feedback.map((item) => (
              <article key={item.feedback_id} className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#07183b]">{item.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#52627a]">
                      {item.requester_role} feedback · {item.requester_name}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    {item.rating}/5
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-[#42536d]">{item.message}</p>
                {item.platform_reply ? (
                  <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#0A2540]">
                    Platform note: {item.platform_reply}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          {!isLoading && feedback.length === 0 ? (
            <p className="mt-6 rounded-xl border border-[#d7e5f2] bg-[#F8FBFE] px-4 py-8 text-center text-sm font-bold text-[#52627a]">
              No feedback is currently approved for public display.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
