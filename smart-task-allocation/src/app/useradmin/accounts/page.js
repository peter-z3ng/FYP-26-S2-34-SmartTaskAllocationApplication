import AccountsPageContent from "@/components/AccountsPageContent";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function UserAdminAccountsPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <AccountsPageContent />
      </GlassSurface>
    </SideMenuLayout>
  );
}
