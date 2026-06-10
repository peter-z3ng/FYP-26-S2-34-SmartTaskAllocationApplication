import EmployeeTaskCenter from "@/components/EmployeeTaskCenter";
import TimeClockPanel from "@/components/TimeClockPanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeTasksPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="My Tasks"
      subtitle="Track your assigned and requested work."
    >
      <div className="space-y-6">
        <TimeClockPanel />
        <EmployeeTaskCenter />
      </div>
    </SideMenuLayout>
  );
}
