import SideMenuLayout from "@/components/SideMenuLayout";
import TaskManagement from "@/components/TaskManagement";

export default function ManagerTasksPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Tasks"
      subtitle="Create, assign, and monitor team tasks."
    >
      <TaskManagement />
    </SideMenuLayout>
  );
}
