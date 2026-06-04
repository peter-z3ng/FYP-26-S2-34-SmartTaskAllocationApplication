import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeHomePage() {
  return (
    <SideMenuLayout actor="employee">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Employee
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Employee Home</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          View assigned work, availability, and task updates.
        </p>
      </header>
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
