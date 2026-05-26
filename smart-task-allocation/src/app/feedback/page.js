import Link from "next/link";
import { feedbackItems } from "@/lib/feedbackData";

export const metadata = {
  title: "User Feedback | Workflow+",
  description: "Read customer feedback and testimonials for Workflow+.",
};

export default function FeedbackPage() {
  const averageRating =
    feedbackItems.reduce((total, item) => total + item.rating, 0) / feedbackItems.length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#071428_0%,#0B2B45_34%,#F7FAFC_34%,#FFFFFF_100%)] text-[#071428]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-white">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#5EEAD4] text-sm font-black text-[#071428]">
            W+
          </span>
          <span className="text-lg font-black tracking-wide">Workflow+</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/#feedback"
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/15"
          >
            Back
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-black text-[#071428] transition hover:bg-[#D9F99D]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-10 text-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5EEAD4]">
          User Feedback
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Read every customer review in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Browse feedback from managers, supervisors, business owners, and operations teams using Workflow+ for task allocation.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-semibold text-slate-200">Average rating</p>
            <p className="mt-2 text-5xl font-black text-[#5EEAD4]">{averageRating.toFixed(1)}/5</p>
            <p className="mt-2 text-sm text-slate-300">{feedbackItems.length} published feedback entries</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {feedbackItems.map((item) => (
            <article key={item.id} className="motion-card rounded-lg border border-[#D8E3EE] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0F766E]">
                    {item.category}
                  </p>
                  <h2 className="mt-3 text-2xl font-black leading-snug text-[#071428]">
                    &quot;{item.quote}&quot;
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#E8F6F3] px-3 py-2 text-sm font-black text-[#0F766E]">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[#52627A]">{item.details}</p>

              <div className="mt-6 border-t border-[#E2E8F0] pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-black text-[#071428]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#52627A]">
                      {item.role}, {item.company}
                    </p>
                  </div>
                  <time className="text-sm font-semibold text-[#57708F]" dateTime={item.date}>
                    {new Date(item.date).toLocaleDateString("en-SG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
