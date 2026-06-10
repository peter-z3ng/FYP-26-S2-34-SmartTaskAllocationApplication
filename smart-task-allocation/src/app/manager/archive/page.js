import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerArchivePage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerPlaceholderPage
        eyebrow="Manager"
        title="Archive"
        description="Review completed, cancelled, or historical work items once archiving is expanded."
      />
    </SideMenuLayout>
  );
}
