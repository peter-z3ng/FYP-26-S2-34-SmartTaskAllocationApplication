import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeTasksPage() {
  return (
    <SideMenuLayout actor="employee">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Employee
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">My Tasks</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Track your assigned and requested work.
        </p>
      </header>
      <HomePanel
        title="Assigned Tasks"
        description="This page will show task assignments, deadlines, and completion status."
      />
    </SideMenuLayout>
  );
}
