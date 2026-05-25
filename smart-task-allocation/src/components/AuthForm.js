"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDashboardRouteForRole } from "@/lib/roleRoutes";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

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

      const { data: accountByUserId, error: accountByUserIdError } = await supabase
        .from("user_account")
        .select("role_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (accountByUserIdError) {
        setError(
          `Login succeeded, but your account could not be loaded: ${accountByUserIdError.message}`,
        );
        return;
      }

      let account = accountByUserId;

      if (!account && data.user.email) {
        const { data: accountByEmail, error: accountByEmailError } = await supabase
          .from("user_account")
          .select("role_id")
          .eq("email", data.user.email)
          .maybeSingle();

        if (accountByEmailError) {
          setError(
            `Login succeeded, but your account could not be loaded: ${accountByEmailError.message}`,
          );
          return;
        }

        account = accountByEmail;
      }

      if (account?.role_id == null) {
        setError("Login succeeded, but no account role is assigned to this user.");
        return;
      }

      const { data: role, error: roleError } = await supabase
        .from("role")
        .select("role_name")
        .eq("role_id", account.role_id)
        .maybeSingle();

      if (roleError) {
        setError(`Login succeeded, but your role could not be loaded: ${roleError.message}`);
        return;
      }

      const roleName =
        role?.role_name ??
        data.user.app_metadata?.role ??
        data.user.user_metadata?.role;
      const dashboardRoute = getDashboardRouteForRole(roleName);

      if (!dashboardRoute) {
        setError("Login succeeded, but your account role does not have a dashboard.");
        return;
      }

      router.push(dashboardRoute);
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
