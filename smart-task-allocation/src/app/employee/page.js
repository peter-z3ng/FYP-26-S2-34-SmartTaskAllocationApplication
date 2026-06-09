import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeHomePage() {
  return (
    <SideMenuLayout
      actor="employee"
      title="Employee Home"
      subtitle="View assigned work, availability, and task updates."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <HomePanel
          title="My Assigned Tasks"
          description="A personal summary area for current assignments, due dates, and task statuses."
        />
        <HomePanel
          title="Availability"
          description="A quick view for work availability and scheduling preferences."
        />
      </div>
    </SideMenuLayout>
  );
}
