"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AcceptInviteForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Checking invitation...");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInviteSession() {
      const supabase = getSupabaseBrowserClient();
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setMessage("");
        return;
      }

      if (!data.session) {
        setError("Invitation session was not found. Open this page from your invite email.");
        setMessage("");
        return;
      }

      setIsReady(true);
      setMessage("");
    }

    loadInviteSession();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(userError?.message || "Could not load invited user.");
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });

      if (passwordError) {
        throw new Error(passwordError.message);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const activateResponse = await fetch("/api/activate-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          userId: userData.user.id,
          email: userData.user.email,
        }),
      });
      const activateResult = await activateResponse.json();

      if (!activateResponse.ok) {
        throw new Error(activateResult.error || "Could not activate account.");
      }

      setMessage("Password created. Redirecting to login...");
      await supabase.auth.signOut();
      router.push("/login");
    } catch (acceptError) {
      setError(acceptError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[28px] border border-white bg-white/85 px-8 py-10 shadow-[0_28px_80px_rgba(15,42,92,0.18)] sm:px-10">
      <h1 className="text-center text-3xl font-bold text-[#061a40]">Accept Invite</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-3">
          <label htmlFor="password" className="block text-base font-medium text-[#061a40]">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            disabled={!isReady}
            className="h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100"
          />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="confirmPassword"
            className="block text-base font-medium text-[#061a40]"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
            disabled={!isReady}
            className="h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20 disabled:bg-slate-100"
          />
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
          disabled={!isReady || isSubmitting}
          className="h-14 w-full rounded-md bg-[#0a2a66] text-base font-bold text-white transition-colors hover:bg-[#061a40] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating password..." : "Create Password"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
        >
          Back to Login
        </Link>
      </div>
    </section>
  );
}
