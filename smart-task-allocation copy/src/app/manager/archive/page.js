import SideMenuLayout from "@/components/SideMenuLayout";
import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import GlassSurface from "@/components/ui/glass-surface";

export default function ManagerArchivePage() {
  return (
    <SideMenuLayout actor="manager">
      <GlassSurface className="relative h-full overflow-hidden p-8">
        <div className="absolute inset-0 flex items-center justify-center rounded-[34px] text-6xl font-bold text-[#0D1E4C]">Coming Soon</div>
        <ManagerPlaceholderPage
          eyebrow="Manager"
          title="Archive"
          description="Browse archived workspaces, teams, and completed operational records."
        />
      </GlassSurface>
    </SideMenuLayout>
  );
}
