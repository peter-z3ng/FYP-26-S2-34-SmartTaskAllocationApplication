"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthStatus() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    async function loadAccount() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        if (isMounted) {
          setAccount(null);
          setLoading(false);
        }
        return;
      }

      const { data: userAccount } = await supabase
        .from("user_account")
        .select("username, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isMounted) {
        setAccount({
          email: userAccount?.email ?? user.email,
          username: userAccount?.username ?? user.email,
        });
        setLoading(false);
      }
    }

    loadAccount();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadAccount();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAccount(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-10 w-32 rounded-md bg-[var(--optima-surface-muted)]" />;
  }

  if (!account) {
    return (
      <nav className="flex items-center gap-2">
        <Link className="rounded-md px-3 py-2 text-sm font-bold text-[var(--optima-primary)] hover:bg-[#93C5FD]/20" href="/login">
          Log in
        </Link>
        <Link className="rounded-md bg-[var(--optima-button)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--optima-button-hover)]" href="/signup">
          Sign up
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2">
      <div className="min-w-0 rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface-muted)] px-3 py-2 text-right">
        <p className="truncate text-xs font-bold text-[var(--optima-secondary)]">Signed in as</p>
        <p className="max-w-[180px] truncate text-sm font-black text-[var(--optima-primary)]">{account.username}</p>
      </div>
      <Link className="rounded-md bg-[var(--optima-button)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--optima-button-hover)]" href="/dashboard">
        Dashboard
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-[var(--optima-border)] bg-[var(--optima-surface)] px-4 py-2 text-sm font-bold text-[var(--optima-primary)] hover:bg-[#93C5FD]/20"
      >
        Log out
      </button>
    </nav>
  );
}
