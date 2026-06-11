"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Suspended: "bg-rose-50 text-rose-700 border-rose-200",
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const defaultRows = [
  { name: "Alicia Tan", detail: "Manager", status: "Active" },
  { name: "Ben Carter", detail: "Frontend Specialist", status: "Active" },
  { name: "Chloe Lim", detail: "Backend Specialist", status: "Pending" },
];

export default function FeaturePage({
  eyebrow,
  title,
  description,
  primaryAction = "Save",
  secondaryAction = "Reset",
  fields = [],
  metrics = [],
  rows = defaultRows,
  links = [],
  checklist = [],
}) {
  const initialForm = useMemo(
    () =>
      fields.reduce((draft, field) => {
        draft[field.name] = field.value ?? "";
        return draft;
      }, {}),
    [fields],
  );
  const [form, setForm] = useState(initialForm);
  const [records, setRecords] = useState(rows);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const filteredRecords = records.filter((record) => {
    const target = `${record.name} ${record.detail} ${record.status}`.toLowerCase();
    return target.includes(query.trim().toLowerCase());
  });

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitForm(event) {
    event.preventDefault();
    const nextRecord = {
      name: form.name || form.title || form.email || title,
      detail: form.detail || form.description || form.role || "Submitted from demo form",
      status: form.status || "Pending",
    };
    setRecords((current) => [nextRecord, ...current]);
    setMessage(`${primaryAction} completed.`);
  }

  function resetForm() {
    setForm(initialForm);
    setMessage("Form reset.");
  }

  function cycleStatus(index) {
    const order = ["Open", "Pending", "Active", "Completed", "Suspended"];
    setRecords((current) =>
      current.map((record, recordIndex) => {
        if (recordIndex !== index) return record;
        const nextStatus = order[(order.indexOf(record.status) + 1) % order.length] || "Open";
        return { ...record, status: nextStatus };
      }),
    );
  }

  function removeRecord(index) {
    setRecords((current) => current.filter((_, recordIndex) => recordIndex !== index));
    setMessage("Record removed.");
  }

  return (
    <section className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">{description}</p>
          </div>
          {links.length ? (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-[#83A6CE] bg-[#F6FAFD] px-4 py-2 text-sm font-bold text-[#0A2540] hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {metrics.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-[#d7e5f2] bg-[#F6FAFD] p-4">
                <p className="text-sm font-bold text-[#64748B]">{metric.label}</p>
                <p className="mt-2 text-3xl font-black text-[#07183b]">{metric.value}</p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={submitForm} className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
            <h2 className="text-xl font-black text-[#07183b]">Action Panel</h2>
            <div className="mt-5 space-y-4">
              {fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="text-sm font-bold text-[#42536d]">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.name] ?? ""}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-[#b8c4d8] px-3 py-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={form[field.name] ?? ""}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      value={form[field.name] ?? ""}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32]">
                {primaryAction}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#83A6CE] bg-white px-5 py-3 text-sm font-bold text-[#0A2540]"
              >
                {secondaryAction}
              </button>
            </div>
            {message ? <p className="mt-4 rounded-lg bg-[#E7F4ED] px-4 py-3 text-sm font-bold text-[#116149]">{message}</p> : null}
          </form>

          <div className="space-y-5">
            {checklist.length ? (
              <div className="rounded-2xl border border-[#d7e5f2] bg-white p-5">
                <h2 className="text-xl font-black text-[#07183b]">Functions Covered</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {checklist.map((item) => (
                    <div key={item} className="rounded-xl border border-[#d7e5f2] bg-[#F8FBFE] px-4 py-3 text-sm font-semibold text-[#42536d]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#d7e5f2] bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black text-[#07183b]">Working Records</h2>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records"
                  className="h-10 rounded-full border border-[#C7DDEB] px-4 text-sm outline-none focus:border-[#0a2a66]"
                />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[#d7e5f2]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F6FAFD] text-[#42536d]">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Detail</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={`${record.name}-${index}`} className="border-t border-[#d7e5f2]">
                        <td className="px-4 py-3 font-bold text-[#07183b]">{record.name}</td>
                        <td className="px-4 py-3 text-[#52627a]">{record.detail}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[record.status] ?? statusStyles.Open}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => cycleStatus(index)}
                              className="rounded-full border border-[#83A6CE] px-3 py-1 text-xs font-bold text-[#0A2540]"
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecord(index)}
                              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
