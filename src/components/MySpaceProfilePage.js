"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const reviewStyles = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const actorLabels = {
  platformadmin: "Platform Admin",
  useradmin: "User Admin",
  manager: "Manager",
  employee: "Employee",
};

export default function MySpaceProfilePage({ actor }) {
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarReview, setAvatarReview] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    position: "",
    phoneNumber: "",
    bio: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFileName, setAvatarFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();

    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadProfile() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/my-profile", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load profile.");
      }

      setAccount(result.account);
      setProfile(result.profile);
      setAvatarReview(result.avatarReview);
      setForm({
        fullName: result.profile?.full_name || result.account?.username || "",
        position: result.profile?.position || "",
        phoneNumber: result.profile?.phone_number || "",
        bio: result.profile?.bio || "",
      });
      setAvatarPreview(result.profile?.profile_picture_url || "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadProfile();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initials = useMemo(() => {
    const name = form.fullName || account?.username || account?.email || "User";
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";
  }, [account, form.fullName]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/my-profile", {
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

      setProfile(result.profile);
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function readAvatarFile(file) {
    setError("");
    setMessage("");

    if (!file) {
      setAvatarFileName("");
      setAvatarPreview(profile?.profile_picture_url || "");
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Upload a PNG, JPG, or WEBP avatar image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ""));
      setAvatarFileName(file.name);
    };
    reader.onerror = () => setError("Could not read avatar image.");
    reader.readAsDataURL(file);
  }

  async function submitAvatar() {
    setError("");
    setMessage("");

    if (!avatarPreview || avatarPreview === profile?.profile_picture_url) {
      setError("Choose a new avatar image first.");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/avatar-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ avatarUrl: avatarPreview }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit avatar for review.");
      }

      setAvatarReview(result.review);
      setMessage("Avatar submitted to Platform Admin for compliance review.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  const currentAvatar = avatarPreview || profile?.profile_picture_url || "";
  const actorLabel = actorLabels[actor] ?? "User";

  return (
    <section className="h-full min-h-0 overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">{actorLabel} My Space</p>
            <h1 className="mt-2 text-3xl font-black text-[#07183b] sm:text-4xl">My Space</h1>
            <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#52627a]">
              Update your personal profile and upload an avatar for Platform Admin review.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-4">
            <p className="text-sm font-bold text-[#64748B]">Signed in as</p>
            <p className="mt-1 text-sm font-black text-[#07183b]">{account?.email || "Loading"}</p>
          </div>
        </header>

        {message ? <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
        {isLoading ? <p className="mt-5 text-sm font-semibold text-[#52627a]">Loading profile...</p> : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-[#C7DDEB] bg-white text-3xl font-black text-[#0D1E4C]">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatar} alt="Profile avatar preview" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-bold text-[#42536d]">Upload avatar</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => readAvatarFile(event.target.files?.[0])}
                className="mt-2 w-full rounded-lg border border-[#b8c4d8] bg-white px-3 py-3 text-sm"
              />
            </label>
            {avatarFileName ? <p className="mt-2 text-xs font-semibold text-[#52627a]">{avatarFileName}</p> : null}
            <button
              type="button"
              onClick={submitAvatar}
              disabled={isUploading}
              className="mt-4 w-full rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? "Submitting..." : "Submit avatar for review"}
            </button>
            {avatarReview ? (
              <div className="mt-5 rounded-xl border border-[#d7e5f2] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#07183b]">Latest avatar review</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${reviewStyles[avatarReview.status] ?? reviewStyles.Pending}`}>
                    {avatarReview.status}
                  </span>
                </div>
                {avatarReview.status === "Rejected" ? (
                  <p className="mt-3 text-sm font-bold text-rose-700">
                    Not approved. {avatarReview.admin_note || "Upload a compliant avatar and submit again."}
                  </p>
                ) : null}
                {avatarReview.status === "Approved" ? (
                  <p className="mt-3 text-sm font-bold text-emerald-800">Approved avatar is now active.</p>
                ) : null}
                {avatarReview.status === "Pending" ? (
                  <p className="mt-3 text-sm font-bold text-amber-800">Waiting for Platform Admin review.</p>
                ) : null}
              </div>
            ) : null}
          </aside>

          <form onSubmit={saveProfile} className="rounded-2xl border border-[#d7e5f2] bg-[#F8FBFE] p-5">
            <h2 className="text-xl font-black text-[#07183b]">Profile details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-[#42536d]">Full name</span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#42536d]">Position</span>
                <input
                  value={form.position}
                  onChange={(event) => updateField("position", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#42536d]">Phone number</span>
                <input
                  value={form.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-[#42536d]">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={7}
                  className="mt-2 w-full rounded-lg border border-[#b8c4d8] px-3 py-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                />
              </label>
            </div>
            <button
              disabled={isSaving}
              className="mt-5 rounded-full bg-[#0D1E4C] px-5 py-3 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
