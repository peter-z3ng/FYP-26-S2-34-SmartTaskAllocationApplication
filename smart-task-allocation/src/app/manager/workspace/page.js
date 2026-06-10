import SideMenuLayout from "@/components/SideMenuLayout";
import TaskManagement from "@/components/TaskManagement";

export default function ManagerWorkspacePage() {
  return (
    <SideMenuLayout actor="manager">
      <TaskManagement />
    </SideMenuLayout>
  );
}
