import SideMenuLayout from "@/components/SideMenuLayout";
import AgentSelection from "@/components/AgentSelection";

export default function ManagerAgentsPage() {
  return (
    <SideMenuLayout actor="manager">
      <AgentSelection />
    </SideMenuLayout>
  );
}
