import EmployeeWorkspaceView from "@/components/EmployeeWorkspaceView";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeWorkspacePage() {
  return (
    <SideMenuLayout actor="employee">
      <EmployeeWorkspaceView />
    </SideMenuLayout>
  );
}
