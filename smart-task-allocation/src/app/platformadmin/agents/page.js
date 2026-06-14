import SideMenuLayout from "@/components/SideMenuLayout";
import AgentSelection from "@/components/AgentSelection";

export default function PlatformAdminAgentsPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <AgentSelection />
    </SideMenuLayout>
  );
}
