import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeTasksPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="My Tasks"
      subtitle="Track your assigned and requested work."
    >
      <HomePanel
        title="Assigned Tasks"
        description="This page will show task assignments, deadlines, and completion status."
      />
    </SideMenuLayout>
  );
}
