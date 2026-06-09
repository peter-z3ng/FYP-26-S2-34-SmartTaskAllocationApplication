"use client";

import { getAuthHeaders } from "@/lib/clientAuth";
import { useEffect, useState } from "react";

export default function SignUpForm({ onSuccess }) {
  const [mode, setMode] = useState("create");
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("Free");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);

    if (nextMode === "invite") {
      setPassword("");
      setUsername("");
    }
  }

  useEffect(() => {
    async function loadOptions() {
      setError("");

      try {
        const headers = await getAuthHeaders();
        const [rolesResponse, organizationsResponse] = await Promise.all([
          fetch("/api/roles", { headers }),
          fetch("/api/organizations", { headers }),
        ]);
        const rolesResult = await rolesResponse.json();
        const organizationsResult = await organizationsResponse.json();

        if (!rolesResponse.ok) {
          throw new Error(rolesResult.error || "Could not load roles.");
        }

        if (!organizationsResponse.ok) {
          throw new Error(organizationsResult.error || "Could not load organizations.");
        }

        setRoles(rolesResult.roles);
        setRoleId(rolesResult.roles[0]?.role_id?.toString() ?? "");
        setOrganizations(organizationsResult.organizations);
        setOrganizationId(organizationsResult.organizations[0]?.organization_id ?? "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingRoles(false);
        setIsLoadingOrganizations(false);
      }
    }

    loadOptions();
  }, []);

  function resetForm() {
    setEmail("");
    setUsername("");
    setPassword("");
    setOrganizationId(organizations[0]?.organization_id ?? "");
    setSubscriptionTier("Free");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(mode === "create" ? "/api/create-user" : "/api/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          email,
          username,
          password,
          roleId,
          organizationId,
          subscriptionTier,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save account.");
      }

      setMessage(mode === "create" ? "Account created." : "Invitation sent.");
      resetForm();
      onSuccess?.();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-[#d8e0ee] bg-white p-6 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#061a40]">Sign Up</h2>
        <div className="mt-5 inline-flex rounded-md border border-[#b8c4d8] bg-[#f4f7fb] p-1">
          <button
            type="button"
            onClick={() => changeMode("create")}
            className={`h-9 rounded px-3 text-sm font-bold transition-colors ${
              mode === "create" ? "bg-[#0a2a66] text-white" : "text-[#061a40]"
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => changeMode("invite")}
            className={`h-9 rounded px-3 text-sm font-bold transition-colors ${
              mode === "invite" ? "bg-[#0a2a66] text-white" : "text-[#061a40]"
            }`}
          >
            Invite
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
          <label htmlFor="password" className="block text-sm font-medium text-[#061a40]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required={mode === "create"}
            disabled={mode === "invite"}
            placeholder={mode === "invite" ? "Set by user" : ""}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100 disabled:text-slate-500"
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
            required={mode === "create"}
            disabled={mode === "invite"}
            placeholder={mode === "invite" ? "Set by user" : ""}
            className="h-11 w-full rounded-md border border-[#b8c4d8] px-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

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
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100"
          >
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="organizationId" className="block text-sm font-medium text-[#061a40]">
            Organization Name
          </label>
          <select
            id="organizationId"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            disabled={isLoadingOrganizations}
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100"
          >
            <option value="">No organization</option>
            {organizations.map((organization) => (
              <option
                key={organization.organization_id}
                value={organization.organization_id}
              >
                {organization.organization_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="subscriptionTier" className="block text-sm font-medium text-[#061a40]">
            User Plan
          </label>
          <select
            id="subscriptionTier"
            value={subscriptionTier}
            onChange={(event) => setSubscriptionTier(event.target.value)}
            className="h-11 w-full rounded-md border border-[#b8c4d8] bg-white px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
          >
            <option value="Free">Free User</option>
            <option value="Paid">Paid Pro User</option>
          </select>
          <p className="text-xs leading-5 text-slate-500">
            Paid Pro users are highlighted with a premium badge across account and profile screens.
          </p>
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
          disabled={isLoadingRoles || isLoadingOrganizations || isSubmitting}
          className="h-11 w-full rounded-md bg-[#0a2a66] px-5 text-sm font-bold text-white transition-colors hover:bg-[#061a40] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Account" : "Send Invite"}
        </button>
      </form>
    </section>
  );
}
