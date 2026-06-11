import Link from "next/link";
import FeaturePage from "@/components/FeaturePage";

export default function GuestFeaturePage({ feature }) {
  return (
    <main className="min-h-screen bg-[#EEF5FA] px-4 py-6 text-[#07183b] sm:px-8">
      <div className="mx-auto max-w-7xl">
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
            <Link className="rounded-full px-3 py-2 hover:bg-white" href="/password-recovery">
              Recover Password
            </Link>
          </nav>
        </header>
        <FeaturePage {...feature} />
      </div>
    </main>
  );
}
