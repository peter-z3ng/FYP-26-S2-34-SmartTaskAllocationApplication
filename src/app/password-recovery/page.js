import PasswordRecoveryForm from "@/components/PasswordRecoveryForm";

export default function PasswordRecoveryPage() {
  return (
    <main className="optima-auth-page flex min-h-screen items-center justify-center bg-[#E0E5E9] p-4">
      <div className="w-full max-w-xl">
        <PasswordRecoveryForm />
      </div>
    </main>
  );
}
