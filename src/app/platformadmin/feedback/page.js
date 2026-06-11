import PlatformFeedbackQueuePage from "@/components/PlatformFeedbackQueuePage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function PlatformAdminFeedbackPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <GlassSurface className="max-h-full overflow-y-auto p-8">
        <PlatformFeedbackQueuePage />
      </GlassSurface>
    </SideMenuLayout>
  );
}
