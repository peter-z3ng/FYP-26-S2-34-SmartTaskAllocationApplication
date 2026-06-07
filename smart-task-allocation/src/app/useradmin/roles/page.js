import RoleManagement from "@/components/RoleManagement";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminRolesPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Roles"
      subtitle="Review role definitions used for account routing."
    >
      <RoleManagement />
    </SideMenuLayout>
  );
}
