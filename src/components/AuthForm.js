"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import CornerNav from "@/components/CornerNav";

const inputClass =
  "h-14 w-full rounded-md border border-white/40 bg-black/40 px-4 text-base text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20";

const demoAccounts = [
  {
    label: "Platform Admin",
    email: "demo-platform@optima.test",
    password: "Test@123456",
    description: "Manage homepage, plans, feedback, and support.",
  },
  {
    label: "User Admin",
    email: "demo-useradmin@optima.test",
    password: "Test@123456",
    description: "Manage accounts, roles, profiles, and paid status.",
  },
  {
    label: "Manager",
    email: "demo-manager@optima.test",
    password: "Test@123456",
    description: "Review inbox, assign tasks, and track employees.",
  },
  {
    label: "Employee",
    email: "demo-employee@optima.test",
    password: "Test@123456",
    description: "Clock in, request tasks, and update work status.",
  },
];

export default function AuthForm() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // "email" | "password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetToEmailStep() {
    setStep("email");
    setPassword("");
    setError("");
    setResetMessage("");
  }

  async function signIn() {
    try {
      if (!isSupabaseConfigured()) {
        const response = await fetch("/api/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Invalid demo credentials.");
          return;
        }

        window.localStorage.setItem("workflowDemoToken", result.accessToken);
        window.localStorage.setItem("workflowDemoEmail", result.email);
        window.localStorage.setItem("workflowDemoUserId", result.userId);
        router.push(result.homeRoute);
        router.refresh();
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const routeResponse = await fetch("/api/home-route", {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` },
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
    }
  }

  async function signInWithDemoAccount(account) {
    setError("");
    setResetMessage("");
    setEmail(account.email);
    setPassword(account.password);
    setStep("password");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email, password: account.password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid demo credentials.");
        return;
      }

      window.localStorage.setItem("workflowDemoToken", result.accessToken);
      window.localStorage.setItem("workflowDemoEmail", result.email);
      window.localStorage.setItem("workflowDemoUserId", result.userId);
      router.push(result.homeRoute);
      router.refresh();
    } catch (demoError) {
      setError(demoError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setIsSubmitting(true);

    try {
      if (step === "email") {
        const response = await fetch("/api/account-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Could not check that email.");
          return;
        }

        if (result.exists) {
          setStep("password");
        } else {
          setError("No account found for this email.");
        }
        return;
      }

      await signIn();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setResetMessage("");

    try {
      if (!isSupabaseConfigured()) {
        router.push(`/password-recovery?email=${encodeURIComponent(email)}`);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetMessage("Password reset link sent. Check your email.");
    } catch (resetError) {
      setError(resetError.message);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <CornerNav onBack={step === "password" ? resetToEmailStep : undefined} />
      <section className="rounded-[28px] border border-white/20 bg-white/10 px-8 py-10 shadow-[0_28px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-10">
        <div className="flex justify-center">
          <Image
            src="/optimalogowhite.png"
            alt="Optima"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>
        <h1 className="mt-4 text-center text-3xl font-bold text-white">Sign in to Optima</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {step === "email" ? (
            <div className="space-y-3">
              <label htmlFor="email" className="block text-base font-medium text-white/90">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
                className={inputClass}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-md border border-white/20 bg-white/10 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium text-white/90">{email}</span>
                <button
                  type="button"
                  onClick={resetToEmailStep}
                  className="shrink-0 text-sm font-semibold text-white hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-base font-medium text-white/90">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  minLength={6}
                  required
                  autoFocus
                  className={inputClass}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-semibold text-white hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </>
          )}

          {error ? (
            <p className="pl-2 -mt-4 text-xs font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {resetMessage ? (
            <p className="pl-2 -mt-4 text-xs font-medium text-emerald-200">
              {resetMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-full border border-white/20 bg-[#2563EB]/20 text-base uppercase font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.60)] transition duration-200 hover:brightness-120 hover:shadow-[0_0_28px_rgba(37,99,235,0.6)] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Authenticating…" : step === "email" ? "Continue" : "Sign in"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/15 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/50">Demo access</p>
              <h2 className="mt-2 text-lg font-semibold text-white">One-click test login</h2>
            </div>
            <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/60 sm:inline-flex">
              No password needed
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => signInWithDemoAccount(account)}
                disabled={isSubmitting}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left transition duration-200 hover:border-white/35 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block text-sm font-bold text-white">{account.label}</span>
                <span className="mt-1 block text-xs leading-5 text-white/60">{account.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-base text-white/80">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-white transition hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
