import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleInboxPage } from "@/components/RoleUtilityPages";

export default function EmployeeInboxPage() {
  return (
    <SideMenuLayout actor="employee">
      <RoleInboxPage actor="employee" />
    </SideMenuLayout>
  );
}
