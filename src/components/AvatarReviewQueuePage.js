"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const statusStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function AvatarReviewQueuePage() {
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState("");
  const [adminNote, setAdminNote] = useState("Avatar approved for profile use.");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadReviews() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/avatar-reviews", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load avatar reviews.");
      }

      setReviews(result.reviews ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadReviews();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter((review) =>
      `${review.user_name} ${review.user_email} ${review.role_name} ${review.status}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, reviews]);

  async function updateReview(reviewId, status) {
    setError("");
    setMessage("");
    setUpdatingId(reviewId);

    try {
      const response = await fetch("/api/avatar-reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          reviewId,
          status,
          adminNote: status === "Rejected" ? adminNote || "Avatar did not pass compliance review. Upload a new image." : adminNote,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update avatar review.");
      }

      setMessage(`Avatar review ${reviewId} marked ${status}.`);
      await loadReviews();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">Platform Admin</p>
          <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">Avatar Review Queue</h1>
          <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
            Review user avatar uploads. Approved avatars update the user profile; rejected avatars return a message asking for a new upload.
          </p>
        </div>
        <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
          <Metric label="Pending" value={reviews.filter((review) => review.status === "Pending").length} />
          <Metric label="Reviewed" value={reviews.filter((review) => review.status !== "Pending").length} />
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_460px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search avatar reviews"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
        <input
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Review note"
          className="h-12 rounded-full border border-[#C7DDEB] bg-white px-5 text-sm text-[#0B1B32] shadow-sm outline-none placeholder:text-[#64748B] focus:border-[#83A6CE] focus:ring-2 focus:ring-[#83A6CE]/25"
        />
      </div>

      {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {isLoading ? <p className="text-sm font-semibold text-[#52627a]">Loading avatar reviews...</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredReviews.map((review) => (
          <article key={review.review_id} className="rounded-[24px] border border-white/60 bg-white/45 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#C7DDEB] bg-white">
                {review.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.avatar_url} alt={`${review.user_name} avatar submission`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-[#52627a]">No image</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#07183b]">{review.user_name}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#52627a]">{review.user_email} · {review.role_name}</p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusStyles[review.status] ?? statusStyles.Pending}`}>
                    {review.status}
                  </span>
                </div>
                {review.admin_note ? (
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#42536d]">
                    Note: {review.admin_note}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateReview(review.review_id, "Approved")}
                    disabled={updatingId === review.review_id}
                    className="rounded-full bg-[#0D1E4C] px-5 py-2 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve avatar
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReview(review.review_id, "Rejected")}
                    disabled={updatingId === review.review_id}
                    className="rounded-full border border-rose-200 bg-white/70 px-5 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject avatar
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-white/60 bg-white/45 p-8 text-center text-sm font-bold text-[#52627a]">
          No avatar reviews match the current search.
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-sm">
      <p className="text-sm font-bold text-[#64748B]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#07183b]">{value}</p>
    </div>
  );
}
