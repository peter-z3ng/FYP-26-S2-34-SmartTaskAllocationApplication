import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeAvailabilityPage() {
  return (
    <SideMenuLayout actor="employee">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Employee
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Availability</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Maintain your available days and working hours.
        </p>
      </header>
      <HomePanel
        title="Availability Schedule"
        description="This page will let employees update availability windows for task allocation."
      />
    </SideMenuLayout>
  );
}
