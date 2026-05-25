import InviteUserForm from "@/components/InviteUserForm";

export default function UserAdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-8 py-10 text-[#061a40]">
      <h1 className="text-3xl font-bold">User Admin Dashboard</h1>
      <InviteUserForm />
    </main>
  );
}
