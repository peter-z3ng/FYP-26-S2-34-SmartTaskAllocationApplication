import SideMenuLayout from "@/components/SideMenuLayout";
import WorkspaceManagement from "@/components/WorkspaceManagement";

export default function ManagerTasksPage() {
  return (
    <SideMenuLayout actor="manager">
      <WorkspaceManagement />
    </SideMenuLayout>
  );
}
