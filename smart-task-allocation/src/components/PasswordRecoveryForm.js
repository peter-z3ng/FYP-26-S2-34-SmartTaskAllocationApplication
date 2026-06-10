"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        setMessage("Local demo mode: password recovery is simulated. Use the listed demo password or ask User Admin to reset the account.");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        throw resetError;
      }

      setMessage("If this email exists, a password recovery link has been sent.");
    } catch (recoveryError) {
      setError(recoveryError.message || "Could not start password recovery.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="optima-auth-panel w-full max-w-xl rounded-lg border border-[#d8e0ee] bg-white px-8 py-10 shadow-sm sm:px-10">
      <div className="flex justify-center">
        <BrandLogo dark />
      </div>
      <p className="mt-5 text-center text-sm font-black uppercase tracking-[0.18em] text-[#0a2a66]">
        Account access
      </p>
      <h1 className="mt-2 text-center text-3xl font-bold text-[#061a40]">Recover password</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-slate-600">
        Enter your account email. Supabase-enabled deployments send a recovery link; local demo mode shows a safe test message.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-3">
          <label htmlFor="recovery-email" className="block text-base font-medium text-[#061a40]">
            Email
          </label>
          <input
            id="recovery-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
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
          {isSubmitting ? "Sending..." : "Send recovery link"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
        >
          Back to login
        </Link>
      </div>
    </section>
  );
}
