"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function InviteUserForm() {
  const [roles, setRoles] = useState([]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [roleId, setRoleId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      setError("");

      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const response = await fetch("/api/roles", {
          headers: {
            Authorization: `Bearer ${data.session?.access_token ?? ""}`,
          },
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load roles.");
        }

        setRoles(result.roles);
        setRoleId(result.roles[0]?.role_id?.toString() ?? "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingRoles(false);
      }
    }

    loadRoles();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          email,
          username,
          roleId,
          organizationId,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send invite.");
      }

      setMessage("Invitation sent. The user can set their password from the email link.");
      setEmail("");
      setUsername("");
      setOrganizationId("");
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 w-full max-w-2xl rounded-lg border border-[#d8e0ee] bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#061a40]">Invite User</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#061a40]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-[#061a40]">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-[#061a40]">
              Role
            </label>
            <select
              id="role"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              disabled={isLoadingRoles}
              required
              className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
            >
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="organizationId"
              className="block text-sm font-medium text-[#061a40]"
            >
              Organization ID
            </label>
            <input
              id="organizationId"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="Optional"
              className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoadingRoles || isSubmitting}
          className="h-11 rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white transition-colors hover:bg-[#061a40] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </section>
  );
}
