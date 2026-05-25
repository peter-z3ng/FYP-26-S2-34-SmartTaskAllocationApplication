import SideMenuLayout from "@/components/SideMenuLayout";
import TeamManagement from "@/components/TeamManagement";

export default function ManagerTeamPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Team"
      subtitle="Understand team skills, availability, and workload."
    >
      <TeamManagement />
    </SideMenuLayout>
  );
}
