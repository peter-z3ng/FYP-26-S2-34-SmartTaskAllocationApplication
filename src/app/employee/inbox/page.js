import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeInboxPage() {
  return (
    <SideMenuLayout actor="employee">
      <ManagerPlaceholderPage
        eyebrow="Employee"
        title="Inbox"
        description="Review workspace updates, team invitations, and direct messages."
      />
    </SideMenuLayout>
  );
}
