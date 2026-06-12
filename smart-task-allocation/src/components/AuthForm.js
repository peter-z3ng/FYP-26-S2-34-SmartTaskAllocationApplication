"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const inputClass =
  "h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20";

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
          setError("We couldn't find an account for that email. Ask your User Admin or sign up.");
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
      <section className="rounded-[28px] border border-white bg-white/85 px-8 py-10 shadow-[0_28px_80px_rgba(15,42,92,0.18)] sm:px-10">
        <div className="flex justify-center">
          <Image
            src="/optimalogoblue.png"
            alt="Optima"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>
        <h1 className="mt-4 text-center text-3xl font-bold text-[#061a40]">Sign in to Optima</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {step === "email" ? (
            <div className="space-y-3">
              <label htmlFor="email" className="block text-base font-medium text-[#061a40]">
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
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#dbe2ee] bg-[#f6f8fc] px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium text-[#061a40]">{email}</span>
                <button
                  type="button"
                  onClick={resetToEmailStep}
                  className="shrink-0 text-sm font-semibold text-[#0a2a66] hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-base font-medium text-[#061a40]">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoFocus
                  className={inputClass}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-semibold text-[#0a2a66] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </>
          )}

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {resetMessage ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {resetMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-md bg-[#0a2a66] text-base font-bold text-white transition-colors hover:bg-[#061a40] focus:outline-none focus:ring-2 focus:ring-[#0a2a66] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : step === "email" ? "Continue" : "Sign in"}
          </button>
        </form>

        <div className="mt-8 space-y-4 text-center">
          <p className="text-sm text-slate-600">Use the account provided by your User Admin.</p>
          <Link
            href="/"
            className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
          >
            Back to Home
          </Link>
        </div>
      </section>

      <p className="mt-6 text-center text-base text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-[#0a2a66] hover:text-[#061a40]">
          Sign up
        </Link>
      </p>
    </div>
  );
}
