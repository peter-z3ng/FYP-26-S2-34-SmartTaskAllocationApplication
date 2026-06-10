import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeSupportPage() {
  return (
    <SideMenuLayout actor="employee">
      <ManagerPlaceholderPage
        eyebrow="Employee"
        title="Support"
        description="Get help with assignments, workspace access, and account questions."
      />
    </SideMenuLayout>
  );
}
