import SideMenuLayout from "@/components/SideMenuLayout";
import WorkspaceManagement from "@/components/WorkspaceManagement";
import GlassSurface from "@/components/ui/glass-surface";

export default function ManagerWorkspacePage() {
  return (
    <SideMenuLayout actor="manager">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <WorkspaceManagement />
      </GlassSurface>
    </SideMenuLayout>
  );
}
