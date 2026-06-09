import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeMySpacePage() {
  return (
    <SideMenuLayout actor="employee">
      <ManagerPlaceholderPage
        eyebrow="Employee"
        title="My Space"
        description="Keep personal notes, saved work, and your own task focus area."
      />
    </SideMenuLayout>
  );
}
