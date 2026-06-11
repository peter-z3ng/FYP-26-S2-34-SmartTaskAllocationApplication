import MySpaceProfilePage from "@/components/MySpaceProfilePage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminMySpacePage() {
  return (
    <SideMenuLayout actor="useradmin">
      <MySpaceProfilePage actor="useradmin" />
    </SideMenuLayout>
  );
}
