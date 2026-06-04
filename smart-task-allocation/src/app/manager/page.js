import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerHomePage() {
  return (
    <SideMenuLayout actor="manager">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Manager Home</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Track team workload, assignments, and workspace requests.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <HomePanel
          title="Workspace Overview"
          description="A manager summary area for active workspace items, unassigned work, and upcoming deadlines."
        />
        <HomePanel
          title="Team Capacity"
          description="A quick view for employee availability, skills, and current assignment load."
        />
      </div>
    </SideMenuLayout>
  );
}
