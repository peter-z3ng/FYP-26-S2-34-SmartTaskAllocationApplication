"use client";

import { Star } from "lucide-react";
import { useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const ratingLabels = {
  1: "Poor",
  2: "Needs improvement",
  3: "Neutral",
  4: "Good",
  5: "Excellent",
};

function clampRating(value) {
  return Math.max(1, Math.min(5, value));
}

function StarRating({ value, onChange }) {
  const ratingValue = clampRating(Number(value) || 5);
  const ratingRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function updateFromPointer(event) {
    const rect = ratingRef.current?.getBoundingClientRect();
    if (!rect?.width) return;

    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const nextRating = clampRating(Math.ceil((x / rect.width) * 5));
    onChange(String(nextRating));
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
    updateFromPointer(event);
  }

  function handlePointerMove(event) {
    if (!isDragging) return;
    updateFromPointer(event);
  }

  function handlePointerUp(event) {
    updateFromPointer(event);
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(String(clampRating(ratingValue - 1)));
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(String(clampRating(ratingValue + 1)));
    }

    if (/^[1-5]$/.test(event.key)) {
      onChange(event.key);
    }
  }

  return (
    <div className="rounded-[18px] border border-[#c7ddeb] bg-[#f8fbfe] px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black text-[#07183b]">Rating</p>
        <p className="text-sm font-black text-[#2563eb]">
          {ratingValue} - {ratingLabels[ratingValue]}
        </p>
      </div>

      <div
        ref={ratingRef}
        role="slider"
        aria-label="Feedback rating"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={ratingValue}
        aria-valuetext={`${ratingValue} - ${ratingLabels[ratingValue]}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        className="mt-3 flex h-12 w-fit touch-none select-none items-center gap-1 rounded-full bg-white px-3 shadow-sm outline-none ring-1 ring-[#d8e6f3] focus:ring-4 focus:ring-[#2563eb]/20"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= ratingValue;
          return (
            <Star
              key={star}
              aria-hidden="true"
              className={`h-8 w-8 transition-colors ${isActive ? "text-[#1d9bf0]" : "text-[#bfd3e6]"}`}
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={2.4}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function UserFeedbackForm({ compact = false }) {
  const [rating, setRating] = useState("5");
  const [category, setCategory] = useState("Task allocation");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submitFeedback(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/user-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ rating, category, message }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit feedback.");
      }

      setStatus("Feedback submitted for platform review.");
      setMessage("");
    } catch (feedbackError) {
      setError(feedbackError.message);
    }
  }

  return (
    <form onSubmit={submitFeedback} className="dashboard-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="dashboard-eyebrow">User feedback</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Share workflow feedback</h2>
          {!compact ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Feedback is sent to Platform Admin for moderation and analysis.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(260px,0.9fr)_minmax(220px,1.1fr)]">
        <StarRating value={rating} onChange={setRating} />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="dashboard-input"
        >
          <option>Task allocation</option>
          <option>Availability</option>
          <option>Time tracking</option>
          <option>Account management</option>
          <option>General</option>
        </select>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell us what worked well or what should be improved."
        required
        className="dashboard-textarea mt-4"
      />

      {error ? <p className="mt-4 dashboard-alert-error">{error}</p> : null}
      {status ? <p className="mt-4 dashboard-alert-info">{status}</p> : null}

      <button type="submit" className="dashboard-button mt-5">
        Submit Feedback
      </button>
    </form>
  );
}
