import SideMenuLayout from "@/components/SideMenuLayout";
import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import GlassSurface from "@/components/ui/glass-surface";

export default function ManagerMySpacePage() {
  return (
    <SideMenuLayout actor="manager">
      <GlassSurface className="relative h-full overflow-hidden p-8">
        <div className="absolute inset-0 flex items-center justify-center rounded-[34px] text-6xl font-bold text-[#0D1E4C]">Coming Soon</div>
        <ManagerPlaceholderPage
          eyebrow="Manager"
          title="My Space"
          description="Keep personal manager shortcuts, assigned work, and profile context here."
        />
      </GlassSurface>
    </SideMenuLayout>
  );
}
