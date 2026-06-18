import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleSupportPage } from "@/components/RoleUtilityPages";

export default function EmployeeSupportPage() {
  return (
    <SideMenuLayout actor="employee">
      <RoleSupportPage actor="employee" />
    </SideMenuLayout>
  );
}
