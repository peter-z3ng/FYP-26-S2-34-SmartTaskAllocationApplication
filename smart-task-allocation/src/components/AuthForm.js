"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabaseClient";

const demoAccounts = [
  { role: "Platform Admin", email: "platformadmin@workflow.test", password: "Test@123456", homeRoute: "/platformadmin" },
  { role: "User Admin", email: "useradmin@workflow.test", password: "Test@123456", homeRoute: "/useradmin/accounts" },
  { role: "Manager", email: "manager@workflow.test", password: "Test@123456", homeRoute: "/manager" },
  { role: "Employee", email: "employee@workflow.test", password: "Test@123456", homeRoute: "/employee" },
];

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const captchaAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createCaptchaChallenge() {
  const values = new Uint32Array(5);

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    values.forEach((_, index) => {
      values[index] = Math.floor(Math.random() * captchaAlphabet.length);
    });
  }

  const code = Array.from(values, (value) => captchaAlphabet[value % captchaAlphabet.length]).join("");
  return {
    code,
    display: code.split("").join(" "),
  };
}

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState({ code: "", display: "Loading" });
  const [captchaInput, setCaptchaInput] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaWidgetIdRef = useRef(null);
  const [isRecaptchaScriptReady, setIsRecaptchaScriptReady] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const useGoogleRecaptcha = Boolean(recaptchaSiteKey);

  useEffect(() => {
    const timer = window.setTimeout(() => setCaptcha(createCaptchaChallenge()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (useGoogleRecaptcha && window.grecaptcha?.render) {
      const timer = window.setTimeout(() => setIsRecaptchaScriptReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [useGoogleRecaptcha]);

  useEffect(() => {
    if (!useGoogleRecaptcha || !isRecaptchaScriptReady || recaptchaWidgetIdRef.current !== null) {
      return;
    }

    const recaptcha = window.grecaptcha;

    if (!recaptcha?.render) {
      return;
    }

    const widgetId = recaptcha.render("login-recaptcha", {
      sitekey: recaptchaSiteKey,
      callback: (token) => {
        setRecaptchaToken(token);
        setError("");
      },
      "expired-callback": () => setRecaptchaToken(""),
      "error-callback": () => {
        setRecaptchaToken("");
        setError("Google reCAPTCHA could not be completed. Please try again.");
      },
    });

    recaptchaWidgetIdRef.current = widgetId;
  }, [isRecaptchaScriptReady, useGoogleRecaptcha]);

  const isCaptchaVerified = useMemo(
    () => Boolean(captcha.code) && captchaInput.trim().toUpperCase() === captcha.code,
    [captcha.code, captchaInput],
  );
  const isHumanVerified = useGoogleRecaptcha ? Boolean(recaptchaToken) : isCaptchaVerified;

  function refreshCaptcha({ clearError = true } = {}) {
    setCaptcha(createCaptchaChallenge());
    setCaptchaInput("");
    if (clearError) {
      setError("");
    }
  }

  const resetGoogleRecaptcha = useCallback(() => {
    if (recaptchaWidgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(recaptchaWidgetIdRef.current);
    }

    setRecaptchaToken("");
  }, []);

  const resetHumanVerification = useCallback(
    ({ clearError = true } = {}) => {
      if (useGoogleRecaptcha) {
        resetGoogleRecaptcha();
      } else {
        refreshCaptcha({ clearError });
      }
    },
    [resetGoogleRecaptcha, useGoogleRecaptcha],
  );

  async function verifyGoogleRecaptcha() {
    const response = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: recaptchaToken }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Google reCAPTCHA verification failed.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isHumanVerified) {
      setError("Please complete the human verification before logging in.");
      resetHumanVerification({ clearError: false });
      return;
    }

    setIsSubmitting(true);

    try {
      if (useGoogleRecaptcha) {
        await verifyGoogleRecaptcha();
      }

      const demoAccount = demoAccounts.find(
        (account) => account.email === email.trim().toLowerCase() && account.password === password,
      );

      if (!isSupabaseConfigured()) {
        if (!demoAccount) {
          setError("Local demo mode is active. Use one of the listed demo accounts.");
          resetHumanVerification({ clearError: false });
          return;
        }

        window.localStorage.setItem("workflowDemoEmail", demoAccount.email);
        window.localStorage.setItem("workflowDemoRole", demoAccount.role);
        setCaptchaInput("");
        resetHumanVerification();
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
        resetHumanVerification({ clearError: false });
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
        resetHumanVerification({ clearError: false });
        return;
      }

      setCaptchaInput("");
      resetHumanVerification();
      router.push(routeResult.homeRoute);
      router.refresh();
    } catch (authError) {
      setError(authError.message);
      resetHumanVerification({ clearError: false });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="optima-auth-panel w-full max-w-xl rounded-lg border border-[#d8e0ee] bg-white px-8 py-10 shadow-sm sm:px-10">
      <div className="flex justify-center">
        <BrandLogo dark />
      </div>
      <h1 className="mt-4 text-center text-3xl font-bold text-[#061a40]">Log in</h1>

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

        {useGoogleRecaptcha ? (
          <div className="rounded-2xl border border-[#d8e0ee] bg-[#f7fafc] p-4">
            <Script
              id="google-recaptcha"
              src="https://www.google.com/recaptcha/api.js?render=explicit"
              strategy="afterInteractive"
              async
              defer
              onLoad={() => setIsRecaptchaScriptReady(true)}
            />
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0a2a66]">
              Google reCAPTCHA
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Complete the Google verification before continuing.
            </p>
            <div className="mt-4 min-h-[78px] overflow-hidden rounded-xl bg-white p-2">
              <div id="login-recaptcha" />
              {!isRecaptchaScriptReady ? (
                <p className="px-2 py-3 text-sm font-bold text-slate-500">Loading Google reCAPTCHA...</p>
              ) : null}
            </div>
            <p className={`mt-2 text-xs font-bold ${isHumanVerified ? "text-[#0F766E]" : "text-slate-500"}`}>
              {isHumanVerified ? "Google verification complete." : "Google verification is required for login."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#d8e0ee] bg-[#f7fafc] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#0a2a66]">
                  Human verification
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Type the characters shown below to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshCaptcha}
                className="rounded-full border border-[#b8c4d8] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0a2a66] transition hover:-translate-y-0.5 hover:border-[#5EEAD4]"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.1fr] sm:items-center">
              <div className="login-captcha-display" aria-label="Verification code">
                {captcha.display}
              </div>
              <div>
                <label htmlFor="captcha" className="sr-only">
                  Enter verification code
                </label>
                <input
                  id="captcha"
                  name="captcha"
                  value={captchaInput}
                  onChange={(event) => setCaptchaInput(event.target.value.toUpperCase())}
                  placeholder="Enter code"
                  required
                  autoComplete="off"
                  className="h-12 w-full rounded-md border border-[#b8c4d8] bg-white px-4 text-base font-bold uppercase tracking-[0.18em] text-[#061a40] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                />
                <p className={`mt-2 text-xs font-bold ${isCaptchaVerified ? "text-[#0F766E]" : "text-slate-500"}`}>
                  {isCaptchaVerified ? "Verification complete." : "Verification is required for login."}
                </p>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !isHumanVerified}
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
