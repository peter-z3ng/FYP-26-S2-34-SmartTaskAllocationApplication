import AvatarReviewQueuePage from "@/components/AvatarReviewQueuePage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function PlatformAdminAvatarReviewsPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <GlassSurface className="max-h-full overflow-y-auto p-8">
        <AvatarReviewQueuePage />
      </GlassSurface>
    </SideMenuLayout>
  );
}
