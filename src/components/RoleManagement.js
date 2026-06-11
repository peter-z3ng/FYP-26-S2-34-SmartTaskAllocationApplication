"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function authHeaders() {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    };
  }

  async function loadRoles() {
    setError("");

    try {
      const response = await fetch("/api/roles", {
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load roles.");
      }

      setRoles(result.roles);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadRoles();
    }, 0);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRole(event) {
    event.preventDefault();

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ roleName, description }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create role.");
      }

      setRoleName("");
      setDescription("");
      await loadRoles();
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function updateRole(role) {
    const nextRoleName = window.prompt("Role name", role.role_name);
    const nextDescription = window.prompt("Description", role.description ?? "");

    if (!nextRoleName) {
      return;
    }

    try {
      const response = await fetch("/api/roles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          roleId: role.role_id,
          roleName: nextRoleName,
          description: nextDescription ?? "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update role.");
      }

      await loadRoles();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteRole(role) {
    const confirmed = window.confirm(`Delete ${role.role_name}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/roles?roleId=${role.role_id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete role.");
      }

      await loadRoles();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createRole}
        className="rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 shadow-sm"
      >
        <h2 className="text-xl font-bold text-[#0B1B32]">Create Role</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            placeholder="Role name"
            required
            className="h-11 rounded-md border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="h-11 rounded-md border border-[#b8c4d8] px-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
          />
        </div>
        <button className="mt-4 h-11 rounded-md bg-[#0D1E4C] px-5 text-sm font-bold text-white hover:bg-[#0B1B32]">
          Add Role
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fill,280px)] justify-start gap-3">
        {roles.map((role) => (
          <section
            key={role.role_id}
            className="w-full max-w-[280px] rounded-[24px] border-2 border-[#83A6CE] bg-[#E0E5E9] p-5 text-center shadow-sm"
          >
            <span className="inline-flex rounded-lg bg-[#C7DDEB] px-4 py-2 text-sm font-black uppercase tracking-widest text-[#0D1E4C]">
              Role
            </span>
            <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#C7DDEB] text-[#0D1E4C]">
              <svg
                className="h-11 w-11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="mt-5 text-xl font-black text-[#0B1B32]">{role.role_name}</h3>
            <p className="mt-2 min-h-10 text-sm text-[#64748B]">
              {role.description || "No description"}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => updateRole(role)}
                className="rounded-full border border-[#83A6CE] bg-white/60 px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-white"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => deleteRole(role)}
                className="text-sm font-semibold text-[#0A2540] hover:text-[#0B1B32] hover:underline"
              >
                Delete
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
