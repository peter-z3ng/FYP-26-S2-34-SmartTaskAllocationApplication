import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeSettingsPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Settings"
      subtitle="Manage your profile and notification preferences."
    >
      <HomePanel
        title="Employee Settings"
        description="This page will contain profile, contact, and notification preferences."
      />
    </SideMenuLayout>
  );
}
