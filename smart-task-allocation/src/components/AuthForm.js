"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

const demoAccounts = [
  { role: "Platform Admin", email: "platformadmin@workflow.test", password: "Test@123456", homeRoute: "/platformadmin" },
  { role: "User Admin", email: "useradmin@workflow.test", password: "Test@123456", homeRoute: "/useradmin/accounts" },
  { role: "Manager", email: "manager@workflow.test", password: "Test@123456", homeRoute: "/manager" },
  { role: "Employee", email: "employee@workflow.test", password: "Test@123456", homeRoute: "/employee" },
];

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
      const demoAccount = demoAccounts.find(
        (account) => account.email === email.trim().toLowerCase() && account.password === password,
      );

      if (!isSupabaseConfigured()) {
        if (!demoAccount) {
          setError("Local demo mode is active. Use one of the listed demo accounts.");
          return;
        }

        router.push(demoAccount.homeRoute);
        router.refresh();
        return;
      }

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

      <div className="mt-8 rounded-2xl border border-[#d8e0ee] bg-[#f7fafc] p-4 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#0a2a66]">
              Demo accounts
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              If Supabase env values are missing, these accounts work in local demo mode for page testing.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setError("");
              }}
              className="rounded-lg border border-[#d8e0ee] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#5EEAD4] hover:shadow-md"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-black text-[#061a40]">{account.role}</span>
                <span className="text-xs font-semibold text-[#0F766E]">Click to fill</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{account.email}</p>
              <p className="mt-1 text-xs text-slate-500">Password: {account.password}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4 text-center">
        <p className="text-sm text-slate-600">
          Use the account provided by your User Admin.
        </p>
        <Link
          href="/"
          className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
