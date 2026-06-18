import SideMenuLayout from "@/components/SideMenuLayout";
import { RoleInboxPage } from "@/components/RoleUtilityPages";

export default function ManagerInboxPage() {
  return (
    <SideMenuLayout actor="manager">
      <RoleInboxPage actor="manager" />
    </SideMenuLayout>
  );
}
