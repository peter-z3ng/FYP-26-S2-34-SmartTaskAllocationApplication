"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import UserTierBadge, { normalizeUserTier } from "@/components/UserTierBadge";
import { getAuthHeaders } from "@/lib/clientAuth";

const AVATAR_SIZE = 360;
const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyForm = {
  fullName: "",
  phoneNumber: "",
  address: "",
  bio: "",
  profilePictureUrl: "",
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read the selected image.")));
    reader.readAsDataURL(file);
  });
}

// Store avatars as a small square data URL so the demo and Supabase modes do not need a storage bucket.
async function createAvatarDataUrl(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const sourceImage = await new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load the selected image.")));
    image.src = rawDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare the avatar image.");
  }

  const sourceSide = Math.min(sourceImage.naturalWidth, sourceImage.naturalHeight);
  const sourceX = (sourceImage.naturalWidth - sourceSide) / 2;
  const sourceY = (sourceImage.naturalHeight - sourceSide) / 2;

  context.drawImage(sourceImage, sourceX, sourceY, sourceSide, sourceSide, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toDataURL("image/jpeg", 0.86);
}

function AvatarReviewNotice({ review, changed }) {
  if (changed) {
    return (
      <p className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-[#0a2a66]">
        New avatar selected. Save profile to send it for Platform Admin review.
      </p>
    );
  }

  if (!review?.status) {
    return null;
  }

  if (review.status === "Rejected") {
    return (
      <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
        Avatar not approved. {review.moderationNote || "Please upload a different profile image."}
      </p>
    );
  }

  if (review.status === "Pending") {
    return (
      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
        Avatar is pending Platform Admin review. It will display after approval.
      </p>
    );
  }

  return (
    <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
      Avatar approved and visible on your profile icon.
    </p>
  );
}

export default function ProfileSettingsForm() {
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [avatarReview, setAvatarReview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    return getAuthHeaders();
  }

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile", { headers: await authHeaders() });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load profile.");
      }

      setAccount(result.account);
      setAvatarReview(result.avatarReview ?? null);
      setForm({
        fullName: result.profile?.full_name ?? "",
        phoneNumber: result.profile?.phone_number ?? "",
        address: result.profile?.address ?? "",
        bio: result.profile?.bio ?? "",
        profilePictureUrl: result.profile?.profile_picture_url ?? "",
      });
      setAvatarPreviewUrl(
        result.avatarReview?.status === "Pending"
          ? result.avatarReview.avatarDataUrl
          : result.profile?.profile_picture_url ?? "",
      );
      setAvatarChanged(false);
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

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setError("");
      setMessage("");

      // Reject unsupported or oversized files before doing any canvas work.
      if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Please upload a JPG, PNG, or WebP image.");
      }

      if (file.size > AVATAR_MAX_SOURCE_BYTES) {
        throw new Error("Avatar image must be 5 MB or smaller.");
      }

      const avatarDataUrl = await createAvatarDataUrl(file);
      updateField("profilePictureUrl", avatarDataUrl);
      setAvatarPreviewUrl(avatarDataUrl);
      setAvatarChanged(true);
      setAvatarReview({ status: "Draft" });
      setMessage("Avatar ready. Save profile to submit it for Platform Admin review.");
    } catch (uploadError) {
      setError(uploadError.message);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");
      const payload = {
        ...form,
        profilePictureUrl: avatarChanged ? form.profilePictureUrl : undefined,
      };
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save profile.");
      }

      setMessage(
        avatarChanged && form.profilePictureUrl
          ? "Profile saved. Avatar sent to Platform Admin for review."
          : "Profile updated.",
      );
      setAvatarReview(result.avatarReview ?? null);
      setAvatarChanged(false);
      await loadProfile();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-xl font-bold text-[#07183b]">Account Details</h2>
          {account ? <UserTierBadge tier={account.subscription_tier} /> : null}
        </div>
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
          <div>
            <dt className="font-bold text-[#57708f]">User Plan</dt>
            <dd className="mt-1 text-[#07183b]">
              {account ? (normalizeUserTier(account.subscription_tier) === "Paid" ? "Paid Pro user" : "Free user") : "Not loaded"}
            </dd>
          </div>
        </dl>
      </section>

      <form onSubmit={saveProfile} className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#07183b]">Profile Information</h2>
        <div className="mt-5 rounded-3xl border border-[#d8e0ee] bg-[#f8fbff] p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[28px] border border-[#b8c4d8] bg-gradient-to-br from-teal-100 to-sky-200 text-2xl font-black text-[#0a2a66] shadow-sm">
                {avatarPreviewUrl ? (
                  <Image
                    src={avatarPreviewUrl}
                    alt=""
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span>{String(form.fullName || account?.username || "TN").slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-teal-700">Profile avatar</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#52627a]">
                  Upload a JPG, PNG, or WebP image. New avatars are sent to Platform Admin for approval before they appear on the profile icon.
                </p>
                <AvatarReviewNotice review={avatarReview} changed={avatarChanged} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[#0a2a66] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#061a40]">
                Upload avatar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadAvatar}
                  className="sr-only"
                />
              </label>
              {avatarPreviewUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    updateField("profilePictureUrl", "");
                    setAvatarPreviewUrl("");
                    setAvatarChanged(true);
                    setAvatarReview(null);
                  }}
                  className="h-11 rounded-full border border-[#b8c4d8] bg-white px-5 text-sm font-black text-[#0a2a66] transition hover:-translate-y-0.5"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
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
