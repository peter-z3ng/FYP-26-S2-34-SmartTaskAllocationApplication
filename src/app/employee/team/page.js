import EmployeeTeamView from "@/components/EmployeeTeamView";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeTeamPage() {
  return (
    <SideMenuLayout actor="employee">
      <EmployeeTeamView />
    </SideMenuLayout>
  );
}
