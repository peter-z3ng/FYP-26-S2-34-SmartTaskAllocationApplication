import AuthForm from "@/components/AuthForm";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E0E5E9]">
      <AuthForm
        initialEmail={params?.email ?? ""}
        initialPassword={params?.password ?? ""}
      />
    </main>
  );
}
