"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const authAction = isSignup
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
      const { error: authError } = await authAction;

      if (authError) {
        setError(authError.message);
        return;
      }

      if (isSignup) {
        setMessage("Account created. Check your email if confirmation is enabled.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-[28px] border border-white bg-white/85 px-8 py-10 shadow-[0_28px_80px_rgba(15,42,92,0.18)] sm:px-10">
      <h1 className="text-center text-3xl font-bold text-[#061a40]">
        {isSignup ? "Sign up" : "Log in"}
      </h1>

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

        {message ? (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a2a66]">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full rounded-md bg-[#0a2a66] text-base font-bold text-white transition-colors hover:bg-[#061a40] focus:outline-none focus:ring-2 focus:ring-[#0a2a66] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Please wait..." : isSignup ? "Create account" : "Continue"}
        </button>
      </form>

      <div className="mt-8 space-y-4 text-center">
        <p className="text-sm text-slate-600">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
          >
            {isSignup ? "Log in" : "Sign up"}
          </Link>
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
