import EmployeeTeamView from "@/components/EmployeeTeamView";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function EmployeeTeamPage() {
  return (
    <SideMenuLayout actor="employee">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <EmployeeTeamView />
      </GlassSurface>
    </SideMenuLayout>
  );
}
