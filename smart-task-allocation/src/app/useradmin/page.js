import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminHomePage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="User Admin Home"
      subtitle="Create invited accounts and manage access for your organization."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <HomePanel
          title="Account Management"
          description="Create accounts directly or send invitation emails from the Accounts page."
        />
        <HomePanel
          title="Organization Access"
          description="Review organizations, accounts, and role assignments from the User Admin menu."
        />
      </div>
    </SideMenuLayout>
  );
}
