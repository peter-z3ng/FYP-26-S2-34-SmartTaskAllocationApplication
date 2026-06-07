"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

export default function TimeClockPanel() {
  const [clockedIn, setClockedIn] = useState(false);
  const [latestLog, setLatestLog] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadClockStatus() {
    try {
      const response = await fetch("/api/time-clock", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load clock status.");
      }

      setClockedIn(result.clockedIn);
      setLatestLog(result.latestLog);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClockStatus();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitClockAction(action) {
    try {
      setError("");
      const response = await fetch("/api/time-clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update clock status.");
      }

      setClockedIn(result.clockedIn);
      setMessage(action === "clock-in" ? "Clock in recorded." : "Clock out recorded.");
      await loadClockStatus();
    } catch (clockError) {
      setError(clockError.message);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#07183b]">Working Time</h2>
          <p className="mt-2 text-sm leading-6 text-[#52627a]">
            Record clock in and clock out events for working session tracking.
          </p>
          <p className="mt-3 text-sm font-bold text-[#0a2a66]">
            Current status: {clockedIn ? "Clocked in" : "Clocked out"}
          </p>
          {latestLog?.created_at ? (
            <p className="mt-1 text-xs text-[#57708f]">
              Last event: {latestLog.action} at {new Date(latestLog.created_at).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={clockedIn}
            onClick={() => submitClockAction("clock-in")}
            className="h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clock In
          </button>
          <button
            type="button"
            disabled={!clockedIn}
            onClick={() => submitClockAction("clock-out")}
            className="h-11 rounded-md border border-[#b8c4d8] px-5 text-sm font-bold text-[#07183b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clock Out
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-medium text-[#0a2a66]">{message}</p> : null}
    </section>
  );
}
