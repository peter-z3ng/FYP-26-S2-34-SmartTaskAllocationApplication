"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { DEMO_TEST_ACCOUNTS } from "@/lib/demoSupabase";

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const routeResponse = await fetch("/api/home-route", {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
      });
      const routeResult = await routeResponse.json();

      if (!routeResponse.ok) {
        setError(`Login succeeded, but ${routeResult.error}`);
        return;
      }

      router.push(routeResult.homeRoute);
      router.refresh();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[28px] border border-white bg-white/85 px-8 py-10 shadow-[0_28px_80px_rgba(15,42,92,0.18)] sm:px-10">
      <h1 className="text-center text-3xl font-bold text-[#061a40]">Log in</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-3">
          <label htmlFor="email" className="block text-base font-medium text-[#061a40]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            className="h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
          />
        </div>

        <div className="space-y-3">
          <label htmlFor="password" className="block text-base font-medium text-[#061a40]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            minLength={6}
            required
            className="h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full rounded-md bg-[#0a2a66] text-base font-bold text-white transition-colors hover:bg-[#061a40] focus:outline-none focus:ring-2 focus:ring-[#0a2a66] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Please wait..." : "Continue"}
        </button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        <p className="text-sm text-slate-600">
          {isDemoMode ? "Use one of the local test accounts below." : "Use the account provided by your User Admin."}
        </p>
        {isDemoMode ? (
          <div className="grid gap-2 text-left">
            {DEMO_TEST_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="rounded-lg border border-[#C7DDEB] bg-white/70 px-4 py-3 text-left text-sm text-[#061a40] transition hover:border-[#0a2a66] hover:bg-white"
              >
                <span className="block font-bold">{account.label}</span>
                <span className="block text-xs text-slate-600">{account.email}</span>
              </button>
            ))}
            <p className="text-center text-xs text-slate-500">
              Password: <span className="font-semibold">Test@123456</span>
            </p>
          </div>
        ) : null}
        <Link
          href="/"
          className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
        >
          Back to Home
        </Link>
        <div className="flex flex-wrap justify-center gap-3 text-sm font-bold">
          <Link href="/password-recovery" className="text-[#0a2a66] hover:underline">
            Recover password
          </Link>
          <Link href="/login/wrong-details" className="text-[#0a2a66] hover:underline">
            Wrong details test
          </Link>
          <Link href="/accept-invite" className="text-[#0a2a66] hover:underline">
            Accept invite
          </Link>
        </div>
      </div>
    </section>
  );
}
