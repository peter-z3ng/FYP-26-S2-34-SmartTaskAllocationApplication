import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeAvailabilityPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Availability"
      subtitle="Maintain your available days and working hours."
    >
      <HomePanel
        title="Availability Schedule"
        description="This page will let employees update availability windows for task allocation."
      />
    </SideMenuLayout>
  );
}
