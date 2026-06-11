import MySpaceProfilePage from "@/components/MySpaceProfilePage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function PlatformAdminMySpacePage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <MySpaceProfilePage actor="platformadmin" />
    </SideMenuLayout>
  );
}
