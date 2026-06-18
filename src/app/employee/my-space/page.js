import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleMySpacePage } from "@/components/RoleUtilityPages";

export default function EmployeeMySpacePage() {
  return (
    <SideMenuLayout actor="employee">
      <RoleMySpacePage actor="employee" />
    </SideMenuLayout>
  );
}
