import SideMenuLayout from "@/components/SideMenuLayout";
import { FeedbackManagement } from "@/components/PlatformAdminPrdPages";

export default function FeedbackPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">Platform Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">User Feedback Management</h1>
        <p className="mt-2 text-sm text-[#52627a]">Manage feedback and review display status.</p>
      </header>
      <FeedbackManagement />
    </SideMenuLayout>
  );
}
