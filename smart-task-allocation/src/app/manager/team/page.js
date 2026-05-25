import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerTeamPage() {
  return (
    <SideMenuLayout
      actor="manager"
      title="Team"
      subtitle="Understand team skills, availability, and workload."
    >
      <HomePanel
        title="Team View"
        description="This page will show employees, skill coverage, and current workload."
      />
    </SideMenuLayout>
  );
}
