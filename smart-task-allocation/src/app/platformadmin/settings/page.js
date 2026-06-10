import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function PlatformAdminSettingsPage() {
  return (
    <SideMenuLayout
      actor="platformadmin"
      title="Platform Admin Profile"
      subtitle="View and update platform administrator account details."
    >
      <ProfileSettingsForm />
    </SideMenuLayout>
  );
}
