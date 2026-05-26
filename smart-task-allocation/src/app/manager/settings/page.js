import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerSettingsPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Settings"
      subtitle="Adjust manager workflow preferences."
    >
      <ProfileSettingsForm />
    </SideMenuLayout>
  );
}
