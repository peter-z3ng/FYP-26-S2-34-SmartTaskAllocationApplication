import SideMenuLayout from "@/components/SideMenuLayout";
import WorkspaceManagement from "@/components/WorkspaceManagement";

export default function ManagerWorkspacePage() {
  return (
    <SideMenuLayout actor="manager">
      <WorkspaceManagement />
    </SideMenuLayout>
  );
}
