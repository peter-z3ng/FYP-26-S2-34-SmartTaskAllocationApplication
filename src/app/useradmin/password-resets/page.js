import PasswordResetRequestsPage from "@/components/PasswordResetRequestsPage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function UserAdminPasswordResetsPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <GlassSurface className="max-h-full overflow-y-auto p-8">
        <PasswordResetRequestsPage />
      </GlassSurface>
    </SideMenuLayout>
  );
}
