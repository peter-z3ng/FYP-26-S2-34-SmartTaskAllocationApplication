import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerHomePage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Manager Home"
      subtitle="Track team workload, assignments, and task requests."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <HomePanel
          title="Task Overview"
          description="A manager summary area for active tasks, unassigned work, and upcoming deadlines."
        />
        <HomePanel
          title="Team Capacity"
          description="A quick view for employee availability, skills, and current assignment load."
        />
      </div>
    </SideMenuLayout>
  );
}
