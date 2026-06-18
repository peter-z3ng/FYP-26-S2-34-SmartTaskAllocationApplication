import PlatformAdminHomeDashboard from "@/components/PlatformAdminHomeDashboard";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function PlatformAdminHomePage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <PlatformAdminHomeDashboard />
    </SideMenuLayout>
  );
}
