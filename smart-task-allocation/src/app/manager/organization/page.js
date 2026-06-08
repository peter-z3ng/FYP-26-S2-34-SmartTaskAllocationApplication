import SideMenuLayout from "@/components/SideMenuLayout";
import ManagerOrganizationChart from "@/components/ManagerOrganizationChart";

export default function ManagerOrganizationPage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerOrganizationChart />
    </SideMenuLayout>
  );
}
