import SideMenuLayout from "@/components/SideMenuLayout";
import { ManagerArchivePage as ManagerArchivePanel } from "@/components/RoleUtilityPages";

export default function ManagerArchivePage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerArchivePanel />
    </SideMenuLayout>
  );
}
