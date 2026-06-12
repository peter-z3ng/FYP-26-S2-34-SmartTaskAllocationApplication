"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const inputClass =
  "h-14 w-full rounded-md border border-[#b8c4d8] bg-transparent px-4 text-base text-[#061a40] outline-none transition-colors placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20";

export default function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage("Account created. Check your email to confirm, then sign in.");
    } catch (signUpError) {
      setError(signUpError.message);
    } finally {
      setIsSubmitting(false);
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
        <h1 className="mt-4 text-center text-3xl font-bold text-[#061a40]">Create your account</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-3">
            <label htmlFor="fullName" className="block text-base font-medium text-[#061a40]">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Jane Doe"
              required
              autoFocus
              className={inputClass}
            />
          </div>

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
              className={inputClass}
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              className={inputClass}
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-md bg-[#0a2a66] text-base font-bold text-white transition-colors hover:bg-[#061a40] focus:outline-none focus:ring-2 focus:ring-[#0a2a66] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Create account"}
          </button>
        </form>
      </section>

      <p className="mt-6 text-center text-base text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-[#0a2a66] hover:text-[#061a40]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
