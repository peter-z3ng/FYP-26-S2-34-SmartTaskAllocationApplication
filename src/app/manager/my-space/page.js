import SideMenuLayout from "@/components/SideMenuLayout";
import MySpaceProfilePage from "@/components/MySpaceProfilePage";

export default function ManagerMySpacePage() {
  return (
    <SideMenuLayout actor="manager">
      <MySpaceProfilePage actor="manager" />
    </SideMenuLayout>
  );
}
