import SideMenuLayout from "@/components/SideMenuLayout";
import AllocationHistory from "@/components/AllocationHistory";
import GlassSurface from "@/components/ui/glass-surface";

export default function ManagerAllocationPage() {
  return (
    <SideMenuLayout actor="manager">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <AllocationHistory />
      </GlassSurface>
    </SideMenuLayout>
  );
}
