import AvailabilityManager from "@/components/AvailabilityManager";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeAvailabilityPage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Availability"
      subtitle="Maintain your available days and working hours."
    >
      <AvailabilityManager />
    </SideMenuLayout>
  );
}
