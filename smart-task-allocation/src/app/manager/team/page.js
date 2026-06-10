import SideMenuLayout from "@/components/SideMenuLayout";
import TeamManagement from "@/components/TeamManagement";

export default function ManagerTeamPage() {
  return (
    <SideMenuLayout actor="manager">
      <TeamManagement />
    </SideMenuLayout>
  );
}
