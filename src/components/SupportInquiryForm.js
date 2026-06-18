"use client";

import { useEffect, useState } from "react";
import UserTierBadge from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";
import { isPaidTier } from "@/lib/paidFeatures";

export default function SupportInquiryForm() {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    inquiryType: "Technical Support",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const isPriority = isPaidTier(account?.subscription_tier);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { headers: await getAuthHeaders() });
        const result = await response.json();

        if (!response.ok) return;

        setAccount(result.account);
        setForm((current) => ({
          ...current,
          name: current.name || result.profile?.full_name || result.account?.username || "",
          email: current.email || result.account?.email || "",
        }));
      } catch {
        setAccount(null);
      }
    }

    loadProfile();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitInquiry(event) {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/contact-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          ...form,
          priority: isPriority,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit support inquiry.");
      }

      setStatus(isPriority ? "Priority support inquiry submitted." : "Support inquiry submitted.");
      setForm({ name: "", email: "", inquiryType: "Technical Support", message: "" });
    } catch (inquiryError) {
      setError(inquiryError.message);
    }
  }

  return (
    <form onSubmit={submitInquiry} className="dashboard-card p-6">
      <p className="dashboard-eyebrow">Platform support</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Contact support</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Send technical or platform questions to the Platform Admin inquiry queue.
      </p>

      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-slate-950">
            {isPriority ? "Priority support enabled" : "Standard support"}
          </span>
          <UserTierBadge tier={account?.subscription_tier ?? "Free"} size="sm" />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isPriority
            ? "Paid Pro inquiries are marked as priority for the Platform Admin support queue."
            : "Upgrade the account to Paid Pro to route future inquiries as priority support."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Name"
          required
          className="dashboard-input"
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="Email"
          required
          className="dashboard-input"
        />
      </div>
      <select
        value={form.inquiryType}
        onChange={(event) => updateField("inquiryType", event.target.value)}
        className="dashboard-input mt-4"
      >
        <option>Technical Support</option>
        <option>Account Access</option>
        <option>Subscription Plan</option>
        <option>General Question</option>
      </select>
      <textarea
        value={form.message}
        onChange={(event) => updateField("message", event.target.value)}
        placeholder="Describe the issue or question."
        required
        className="dashboard-textarea mt-4"
      />

      {error ? <p className="mt-4 dashboard-alert-error">{error}</p> : null}
      {status ? <p className="mt-4 dashboard-alert-info">{status}</p> : null}

      <button type="submit" className="dashboard-button mt-5">
        Send Inquiry
      </button>
    </form>
  );
}
