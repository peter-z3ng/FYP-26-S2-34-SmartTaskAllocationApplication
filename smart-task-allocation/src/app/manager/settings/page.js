import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerSettingsPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Settings"
      subtitle="Adjust manager workflow preferences."
    >
      <HomePanel
        title="Manager Settings"
        description="This page will contain manager notification, task, and team preferences."
      />
    </SideMenuLayout>
  );
}
