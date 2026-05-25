import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminOrganizationPage() {
  return (
    <SideMenuLayout
      actor="useradmin"
      title="Organization"
      subtitle="View and manage organization details."
    >
      <HomePanel
        title="Organization Directory"
        description="This page will show organization records, contact details, and organization status."
      />
    </SideMenuLayout>
  );
}
