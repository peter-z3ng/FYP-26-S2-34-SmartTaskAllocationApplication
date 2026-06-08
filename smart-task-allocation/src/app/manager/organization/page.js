import SideMenuLayout from "@/components/SideMenuLayout";
import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";

export default function ManagerOrganizationPage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerPlaceholderPage
        eyebrow="Manager"
        title="Organization"
        description="View organization structure, departments, and team context from one place."
      />
    </SideMenuLayout>
  );
}
