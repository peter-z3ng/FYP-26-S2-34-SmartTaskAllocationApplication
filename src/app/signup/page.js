import Link from "next/link";
import SignUpForm from "@/components/SignUpForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF5FA] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-[#07183b]">
            OPTIMA
          </Link>
          <Link href="/login" className="text-sm font-bold text-[#0a2a66]">
            Back to login
          </Link>
        </div>
        <SignUpForm />
      </div>
    </main>
  );
}
