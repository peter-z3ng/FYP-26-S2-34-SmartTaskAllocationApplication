import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061225] p-4">
      <div className="animated-base absolute inset-0" aria-hidden="true" />
      <div className="animated-mesh absolute inset-0" aria-hidden="true" />
      <div className="particle-field absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl">
        <AuthForm />
      </div>
    </main>
  );
}
