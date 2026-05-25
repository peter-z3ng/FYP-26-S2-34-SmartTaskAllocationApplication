import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminRolesPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Roles"
      subtitle="Review role definitions used for account routing."
    >
      <HomePanel
        title="Role Management"
        description="This page will list Platform Admin, User Admin, Manager, and Employee role definitions."
      />
    </SideMenuLayout>
  );
}
