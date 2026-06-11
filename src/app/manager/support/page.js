import SideMenuLayout from "@/components/SideMenuLayout";
import SupportCenterPage from "@/components/SupportCenterPage";

export default function ManagerSupportPage() {
  return (
    <SideMenuLayout actor="manager">
      <SupportCenterPage actor="manager" />
    </SideMenuLayout>
  );
}
