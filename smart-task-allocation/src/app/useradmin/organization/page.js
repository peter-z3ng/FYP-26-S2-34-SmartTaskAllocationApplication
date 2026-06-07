import OrganizationProfileForm from "@/components/OrganizationProfileForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminOrganizationPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Organization"
      subtitle="View and manage organization details."
    >
      <OrganizationProfileForm />
    </SideMenuLayout>
  );
}
