"use client";

import Link from "next/link";
import { useState } from "react";

export default function PasswordRecoveryForm() {
  const [email, setEmail] = useState("demo-employee@optima.test");
  const [note, setNote] = useState("I cannot access my account during demo testing.");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRecoveryRequest(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, note }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit password recovery request.");
      }

      setRequest(result.request);
      setMessage("Your request has been sent to the User Admin. They can reset your password from their dashboard.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF5FA] px-4 py-6 text-[#07183b] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-white bg-white/70 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black text-[#07183b]">
            OPTIMA
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-bold text-[#0A2540]">
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/login">
              Login
            </Link>
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/signup">
              Sign up
            </Link>
          </nav>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#BBE1FA] bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#07183b] px-6 py-8 text-white sm:px-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#BBE1FA]">
                4.6 Account Access
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Password Recovery Page</h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-[#DCEAF6]">
                Submit the locked account email and the system will create a password reset request for the User Admin queue.
              </p>
              <div className="mt-8 grid gap-3">
                {[
                  "Capture account email and recovery note",
                  "Create a User Admin notification record",
                  "Allow User Admin to mark reset assistance complete",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-8 sm:px-8">
              <form onSubmit={submitRecoveryRequest} className="space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Account email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-lg border border-[#b8c4d8] px-4 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    placeholder="name@example.com"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-[#42536d]">Recovery note</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-[#b8c4d8] px-4 py-3 text-sm outline-none focus:border-[#0a2a66] focus:ring-2 focus:ring-[#0a2a66]/20"
                    placeholder="Briefly describe the access issue."
                  />
                </label>

                <button
                  disabled={isSubmitting}
                  className="h-12 rounded-full bg-[#0D1E4C] px-6 text-sm font-bold text-white hover:bg-[#0B1B32] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send recovery request"}
                </button>
              </form>

              {message ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-bold text-emerald-800">
                  {message}
                  {request ? (
                    <dl className="mt-3 grid gap-2 text-xs font-semibold text-emerald-900 sm:grid-cols-2">
                      <div>
                        <dt className="uppercase tracking-wide opacity-70">Request ID</dt>
                        <dd>{request.request_id}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide opacity-70">Status</dt>
                        <dd>{request.status}</dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="mt-7 rounded-xl border border-[#d7e5f2] bg-[#F8FBFE] p-4 text-sm text-[#52627a]">
                Demo check: log in as <span className="font-bold text-[#07183b]">demo-useradmin@optima.test</span> and open{" "}
                <Link href="/useradmin/password-resets" className="font-bold text-[#0a2a66] hover:underline">
                  Password Resets
                </Link>{" "}
                to process the request.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
