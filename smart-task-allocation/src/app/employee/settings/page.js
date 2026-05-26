import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeSettingsPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Settings"
      subtitle="Manage your profile and notification preferences."
    >
      <ProfileSettingsForm />
    </SideMenuLayout>
  );
}
