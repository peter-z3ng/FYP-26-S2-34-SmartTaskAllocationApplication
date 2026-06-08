"use client";

import { useEffect, useState } from "react";
import HomePanel from "@/components/HomePanel";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function PlatformAdminSettings() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        if (!accessToken) {
          setAccount(null);
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

        setAccount(result.account);
      } catch (profileError) {
        setError(profileError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

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
      <h2 className="text-xl font-bold text-[#07183b]">Profile</h2>
      <p className="mt-2 text-sm text-[#52627a]">
        Review the account details linked to your signed-in Platform Admin user.
      </p>

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
    </section>
  );
}
