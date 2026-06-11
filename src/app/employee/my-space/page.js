import MySpaceProfilePage from "@/components/MySpaceProfilePage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeMySpacePage() {
  return (
    <SideMenuLayout actor="employee">
      <MySpaceProfilePage actor="employee" />
    </SideMenuLayout>
  );
}
