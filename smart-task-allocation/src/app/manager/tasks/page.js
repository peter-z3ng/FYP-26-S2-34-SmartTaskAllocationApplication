import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerTasksPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Tasks"
      subtitle="Create, assign, and monitor team tasks."
    >
      <HomePanel
        title="Task Management"
        description="This page will contain task lists, assignment status, and scheduling controls."
      />
    </SideMenuLayout>
  );
}
