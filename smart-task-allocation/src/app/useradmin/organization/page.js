import SideMenuLayout from "@/components/SideMenuLayout";
import UserAdminOrganizationBuilder from "@/components/UserAdminOrganizationBuilder";

export default function UserAdminOrganizationPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <UserAdminOrganizationBuilder />
    </SideMenuLayout>
  );
}
