import Link from "next/link";
import SignUpForm from "@/components/SignUpForm";

export default function SignupPage() {
  return (
    <main className="optima-auth-page flex min-h-screen items-center justify-center bg-[#E0E5E9] p-4">
      <div className="w-full max-w-md">
        <SignUpForm />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block text-lg font-bold text-[#0a2a66] transition-colors hover:text-[#061a40]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
