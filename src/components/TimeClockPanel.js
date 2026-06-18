"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

function formatDateTime(value) {
  if (!value) {
    return "No record yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TimeClockPanel() {
  const [clockedIn, setClockedIn] = useState(false);
  const [latestLog, setLatestLog] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadClockStatus = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/time-clock", { headers: await getAuthHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load clock status.");
      }

      setClockedIn(result.clockedIn);
      setLatestLog(result.latestLog);
      setHistory(result.history ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClockStatus();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadClockStatus]);

  async function submitClockAction(action) {
    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/time-clock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
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
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusLabel = isLoading ? "Loading..." : clockedIn ? "Clocked in" : "Clocked out";
  const latestEventLabel = latestLog
    ? `${latestLog.action} at ${formatDateTime(latestLog.created_at)}`
    : "No record yet";

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#d6e5f8] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5e7191]">Employee time clock</p>
            <h2 className="mt-3 text-3xl font-black text-[#07183b]">Working time details</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52627a]">
              Open this page from the employee sidebar when you start or finish work. Managers can assign new tasks only
              while your status is clocked in.
            </p>
          </div>

          <div
            className={`min-w-52 rounded-2xl px-5 py-4 text-left ${
              clockedIn ? "bg-emerald-50 text-emerald-900" : "bg-[#eef6ff] text-[#0D1E4C]"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5e7191]">Current status</p>
            <p className="mt-2 text-2xl font-black">{statusLabel}</p>
            <p className="mt-2 text-xs font-bold text-[#57708f]">
              Last event: {latestEventLabel}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={clockedIn || isLoading || isSubmitting}
            onClick={() => submitClockAction("clock-in")}
            className="h-12 rounded-md bg-[#0a2a66] px-6 text-sm font-black text-white transition hover:bg-[#07183b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clock In
          </button>
          <button
            type="button"
            disabled={!clockedIn || isLoading || isSubmitting}
            onClick={() => submitClockAction("clock-out")}
            className="h-12 rounded-md border border-[#b8c4d8] bg-white px-6 text-sm font-black text-[#07183b] transition hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clock Out
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-4 rounded-md bg-[#eef6ff] px-4 py-3 text-sm font-bold text-[#0a2a66]">{message}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#d6e5f8] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5e7191]">Recent activity</p>
            <h3 className="mt-2 text-xl font-black text-[#07183b]">Time clock history</h3>
          </div>
          <p className="text-sm font-bold text-[#57708f]">{history.length} recent records</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#d6deed]">
          <div className="grid grid-cols-[150px_minmax(220px,1fr)_180px] bg-[#f8faff] text-sm font-black text-[#2f3442]">
            <div className="px-5 py-3">Action</div>
            <div className="px-5 py-3">Details</div>
            <div className="px-5 py-3">Time</div>
          </div>

          {history.map((log) => (
            <div
              key={log.log_id ?? `${log.action}-${log.created_at}`}
              className="grid grid-cols-[150px_minmax(220px,1fr)_180px] border-t border-[#d6deed] text-sm text-[#2f3442]"
            >
              <div className="px-5 py-4 font-black text-[#0a2a66]">{log.action}</div>
              <div className="px-5 py-4 font-medium text-[#52627a]">{log.details ?? "Time clock update."}</div>
              <div className="px-5 py-4 font-bold text-[#57708f]">{formatDateTime(log.created_at)}</div>
            </div>
          ))}

          {!history.length ? (
            <div className="border-t border-[#d6deed] px-5 py-8 text-center text-sm font-bold text-[#667085]">
              No clock activity yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
