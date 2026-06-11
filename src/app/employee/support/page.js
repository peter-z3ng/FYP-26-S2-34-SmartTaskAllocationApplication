import SideMenuLayout from "@/components/SideMenuLayout";
import SupportCenterPage from "@/components/SupportCenterPage";

export default function EmployeeSupportPage() {
  return (
    <SideMenuLayout actor="employee">
      <SupportCenterPage actor="employee" />
    </SideMenuLayout>
  );
}
