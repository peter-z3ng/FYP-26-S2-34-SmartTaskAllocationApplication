"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const emptyForm = {
  fullName: "",
  phoneNumber: "",
  address: "",
  bio: "",
};

export default function ProfileSettingsForm() {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load profile.");
      }

      setAccount(result.account);
      setForm({
        fullName: result.profile?.full_name ?? "",
        phoneNumber: result.profile?.phone_number ?? "",
        address: result.profile?.address ?? "",
        bio: result.profile?.bio ?? "",
      });
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProfile();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save profile.");
      }

      setMessage("Profile updated.");
      await loadProfile();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Account Details</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-bold text-[#57708f]">Username</dt>
            <dd className="mt-1 text-[#07183b]">{account?.username ?? "Not loaded"}</dd>
          </div>
          <div>
            <dt className="font-bold text-[#57708f]">Email</dt>
            <dd className="mt-1 text-[#07183b]">{account?.email ?? "Not loaded"}</dd>
          </div>
          <div>
            <dt className="font-bold text-[#57708f]">Status</dt>
            <dd className="mt-1 text-[#07183b]">{account?.account_status ?? "Not loaded"}</dd>
          </div>
        </dl>
      </section>

      <form onSubmit={saveProfile} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Profile Information</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <input
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            placeholder="Full name"
            className="h-11 rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
            required
          />
          <input
            value={form.phoneNumber}
            onChange={(event) => updateField("phoneNumber", event.target.value)}
            placeholder="Phone number"
            className="h-11 rounded-md border border-[#b8c4d8] px-3 text-sm outline-none"
          />
        </div>
        <textarea
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Address"
          className="mt-4 min-h-24 w-full rounded-md border border-[#b8c4d8] px-3 py-2 text-sm outline-none"
        />
        <textarea
          value={form.bio}
          onChange={(event) => updateField("bio", event.target.value)}
          placeholder="Bio"
          className="mt-4 min-h-24 w-full rounded-md border border-[#b8c4d8] px-3 py-2 text-sm outline-none"
        />

        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-[#0a2a66]">{message}</p> : null}

        <button className="mt-5 h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white">
          Save Profile
        </button>
      </form>
    </div>
  );
}
