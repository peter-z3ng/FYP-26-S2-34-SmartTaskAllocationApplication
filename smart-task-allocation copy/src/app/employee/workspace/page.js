import EmployeeWorkspaceView from "@/components/EmployeeWorkspaceView";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function EmployeeWorkspacePage() {
  return (
    <SideMenuLayout actor="employee">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <EmployeeWorkspaceView />
      </GlassSurface>
    </SideMenuLayout>
  );
}
