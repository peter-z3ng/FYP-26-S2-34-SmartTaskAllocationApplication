"use client";

import { useEffect, useState } from "react";
import HomePanel from "@/components/HomePanel";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function PlatformAdminSettings() {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ username: "", email: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function getAccessToken() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  function setAccountState(nextAccount) {
    setAccount(nextAccount);
    setForm({
      username: nextAccount?.username || "",
      email: nextAccount?.email || nextAccount?.auth_email || "",
    });
  }

  async function loadProfile() {
    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setAccountState(null);
        return;
      }

      const response = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load profile.");
      }

      setAccountState(result.account);
    } catch (profileError) {
      setError(profileError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProfile();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function cancelEdit() {
    setForm({
      username: account?.username || "",
      email: account?.email || account?.auth_email || "",
    });
    setIsEditing(false);
    setError("");
    setMessage("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("You must be logged in to update your profile.");
      }

      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update profile.");
      }

      setAccountState(result.account);
      setIsEditing(false);
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <HomePanel title="Profile" description="Loading your profile..." />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {error}
      </p>
    );
  }

  if (!account) {
    return (
      <HomePanel
        title="Profile"
        description="Log in to view your Platform Admin profile."
      />
    );
  }

  const profileItems = [
    ["Username", account.username || "Not set"],
    ["Email", account.email || account.auth_email || "Not set"],
    ["Role ID", account.role_id ?? "Not assigned"],
    ["Account Status", account.account_status || "Not set"],
    ["Organisation ID", account.organization_id || "Not assigned"],
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#07183b]">Profile</h2>
          <p className="mt-2 text-sm text-[#52627a]">
            Review and update the account details linked to your signed-in Platform Admin user.
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setMessage("");
              setError("");
            }}
            className="h-11 rounded-full bg-[#0D1E4C] px-6 text-sm font-bold text-white transition hover:bg-[#07183b]"
          >
            Edit Profile
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      {isEditing ? (
        <form onSubmit={saveProfile} className="mt-6 rounded-[24px] bg-[#f8faff] p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#57708f]">
                Username
              </span>
              <input
                value={form.username}
                onChange={(event) => updateForm("username", event.target.value)}
                className="h-12 rounded-xl border border-[#83A6CE] bg-white px-4 text-sm font-bold text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#57708f]">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="h-12 rounded-xl border border-[#83A6CE] bg-white px-4 text-sm font-bold text-[#07183b] outline-none focus:ring-2 focus:ring-[#83A6CE]/30"
                required
              />
            </label>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 rounded-full bg-[#0D1E4C] px-6 text-sm font-bold text-white transition hover:bg-[#07183b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="h-11 rounded-full border border-[#83A6CE] bg-white px-6 text-sm font-bold text-[#07183b] transition hover:bg-[#E0E5E9]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {profileItems.map(([label, value]) => (
            <div
              key={label}
              className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-widest text-[#57708f]">
                {label}
              </p>
              <p className="mt-2 break-words text-base font-bold text-[#07183b]">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
