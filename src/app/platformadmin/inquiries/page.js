import PlatformSupportQueuePage from "@/components/PlatformSupportQueuePage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function PlatformAdminInquiriesPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <GlassSurface className="max-h-full overflow-y-auto p-8">
        <PlatformSupportQueuePage />
      </GlassSurface>
    </SideMenuLayout>
  );
}
