import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleMySpacePage } from "@/components/RoleUtilityPages";

export default function ManagerMySpacePage() {
  return (
    <SideMenuLayout actor="manager">
      <RoleMySpacePage actor="manager" />
    </SideMenuLayout>
  );
}
