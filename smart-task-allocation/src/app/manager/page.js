import ManagerHomeDashboard from "@/components/ManagerHomeDashboard";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerHomePage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Manager Home"
      subtitle="Track team workload, assignments, and task requests."
    >
      <ManagerHomeDashboard />
    </SideMenuLayout>
  );
}
