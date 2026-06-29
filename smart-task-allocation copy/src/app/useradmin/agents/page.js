import SideMenuLayout from "@/components/SideMenuLayout";
import AgentSelection from "@/components/AgentSelection";

export default function UserAdminAgentsPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <AgentSelection />
    </SideMenuLayout>
  );
}
