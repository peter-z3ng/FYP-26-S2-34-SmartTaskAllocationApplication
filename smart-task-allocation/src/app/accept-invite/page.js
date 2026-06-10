import AcceptInviteForm from "@/components/AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <main className="optima-auth-page flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6 py-12">
      <div className="w-full max-w-xl">
        <AcceptInviteForm />
      </div>
    </main>
  );
}
