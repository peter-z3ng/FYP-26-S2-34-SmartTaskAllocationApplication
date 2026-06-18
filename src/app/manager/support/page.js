import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleSupportPage } from "@/components/RoleUtilityPages";

export default function ManagerSupportPage() {
  return (
    <SideMenuLayout actor="manager">
      <RoleSupportPage actor="manager" />
    </SideMenuLayout>
  );
}
