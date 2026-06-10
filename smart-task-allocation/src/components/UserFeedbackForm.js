"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="dashboard-input"
        >
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Neutral</option>
          <option value="2">2 - Needs improvement</option>
          <option value="1">1 - Poor</option>
        </select>
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
