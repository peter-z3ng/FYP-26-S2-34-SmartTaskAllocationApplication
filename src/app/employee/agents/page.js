import SideMenuLayout from "@/components/SideMenuLayout";
import AgentSelection from "@/components/AgentSelection";

export default function EmployeeAgentsPage() {
  return (
    <SideMenuLayout actor="employee">
      <AgentSelection />
    </SideMenuLayout>
  );
}
