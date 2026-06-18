"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/clientAuth";

const emptyForm = {
  dayOfWeek: "Monday",
  startTime: "09:00",
  endTime: "17:00",
  status: "Available",
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityManager() {
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadAvailability() {
    try {
      const response = await fetch("/api/availability", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load availability.");
      }

      setAvailability(result.availability ?? []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAvailability();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveAvailability(event) {
    event.preventDefault();

    try {
      setError("");
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save availability.");
      }

      setMessage("Availability window saved.");
      setForm(emptyForm);
      await loadAvailability();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteAvailability(availabilityId) {
    if (!window.confirm("Delete this availability window?")) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`/api/availability?availabilityId=${availabilityId}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete availability.");
      }

      setMessage("Availability window deleted.");
      await loadAvailability();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={saveAvailability} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Add Availability</h2>
        <p className="mt-2 text-sm leading-6 text-[#52627a]">
          These windows are used by smart allocation to avoid assigning work when you are unavailable.
        </p>

        <div className="mt-5 space-y-4">
          <select
            value={form.dayOfWeek}
            onChange={(event) => updateField("dayOfWeek", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
          >
            {days.map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) => updateField("startTime", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(event) => updateField("endTime", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none"
          >
            <option>Available</option>
            <option>Unavailable</option>
          </select>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-[#0a2a66]">{message}</p> : null}

        <button className="mt-5 h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white">
          Save Availability
        </button>
      </form>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Availability Schedule</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {availability.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#b8c4d8] p-5 text-sm text-[#52627a]">
              No availability windows found.
            </p>
          ) : null}

          {availability.map((item) => (
            <article key={item.availability_id} className="rounded-lg border border-[#d8e0ee] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#07183b]">{item.day_of_week}</h3>
                  <p className="mt-1 text-sm text-[#52627a]">
                    {item.start_time} - {item.end_time}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-[#eef2f8] px-3 py-1 text-xs font-bold text-[#0a2a66]">
                    {item.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteAvailability(item.availability_id)}
                  className="rounded-md bg-[#cf3033] px-3 py-2 text-sm font-bold text-white"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
