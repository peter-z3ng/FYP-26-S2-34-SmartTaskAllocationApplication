import PlatformAdminConsole from "@/components/PlatformAdminConsole";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function PlatformAdminHomePage() {
  return (
    <SideMenuLayout
      actor="platformadmin"
      title="Platform Control Center"
      subtitle="Manage homepage content, pricing plans, user feedback, contact inquiries, and activity logs."
    >
      <PlatformAdminConsole />
    </SideMenuLayout>
  );
}
