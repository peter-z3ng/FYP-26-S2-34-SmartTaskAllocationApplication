import ManagerOrganizationChart from "@/components/ManagerOrganizationChart";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerOrganizationPage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerOrganizationChart />
    </SideMenuLayout>
  );
}
