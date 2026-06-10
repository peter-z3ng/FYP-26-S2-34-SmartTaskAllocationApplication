"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function formatDateTime(value) {
  if (!value) {
    return "No timestamp";
  }

  return new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actorLabel(log) {
  if (log.user?.username) {
    return log.user.username;
  }

  if (log.user?.email) {
    return log.user.email;
  }

  if (log.user_id) {
    return log.user_id;
  }

  return "System";
}

export default function ActivityLogsPageContent() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadLogs() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/activity-logs", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load activity logs.");
      }

      setLogs(result.logs ?? []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadLogs();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return logs;
    }

    return logs.filter((log) =>
      [
        log.log_id,
        log.user_id,
        actorLabel(log),
        log.action,
        log.details,
        formatDateTime(log.created_at),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch)),
    );
  }, [logs, search]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#07183b]">System Activity Logs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52627a]">
            Review recent platform activity such as user updates, task creation, and
            allocation actions recorded by the system.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search logs"
            className="h-11 w-full rounded-full border border-[#83A6CE] bg-white px-5 text-sm font-semibold text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30 lg:w-80"
          />
          <button
            type="button"
            onClick={loadLogs}
            className="h-11 rounded-full bg-[#0D1E4C] px-6 text-sm font-bold text-white transition hover:bg-[#07183b]"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm font-semibold text-[#52627a]">Loading activity logs...</p>
      ) : null}

      {!isLoading && !filteredLogs.length ? (
        <p className="mt-6 rounded-md border border-dashed border-[#83A6CE] bg-[#E0E5E9] p-4 text-sm font-semibold text-[#57708f]">
          No activity logs found.
        </p>
      ) : null}

      {filteredLogs.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-[#57708f]">
                <th className="py-3 pr-4">Log ID</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Details</th>
                <th className="py-3 pr-4">Actor</th>
                <th className="py-3 pr-4">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="border-b border-slate-100">
                  <td className="py-4 pr-4 font-mono text-xs text-slate-600">
                    {log.log_id}
                  </td>
                  <td className="py-4 pr-4 font-bold text-[#07183b]">
                    {log.action || "Activity"}
                  </td>
                  <td className="max-w-md py-4 pr-4 text-slate-700">
                    {log.details || "No details recorded."}
                  </td>
                  <td className="py-4 pr-4 text-slate-700">{actorLabel(log)}</td>
                  <td className="py-4 pr-4 text-slate-700">
                    {formatDateTime(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
