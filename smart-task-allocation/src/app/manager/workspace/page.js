import SideMenuLayout from "@/components/SideMenuLayout";
import WorkspaceManagement from "@/components/WorkspaceManagement";

export default function ManagerWorkspacePage() {
  return (
    <SideMenuLayout actor="manager">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Workspace</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Create workspaces and manage team tasks in one shared view.
        </p>
      </header>
      <WorkspaceManagement />
    </SideMenuLayout>
  );
}
