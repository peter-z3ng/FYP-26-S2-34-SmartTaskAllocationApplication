import SideMenuLayout from "@/components/SideMenuLayout";
import TeamManagement from "@/components/TeamManagement";
import GlassSurface from "@/components/ui/glass-surface";

export default function ManagerTeamPage() {
  return (
    <SideMenuLayout actor="manager">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <TeamManagement />
      </GlassSurface>
    </SideMenuLayout>
  );
}
