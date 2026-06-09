import AccountsPageContent from "@/components/AccountsPageContent";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminAccountsPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Accounts"
      subtitle="Create accounts directly or send invitation emails."
    >
      <AccountsPageContent />
    </SideMenuLayout>
  );
}
