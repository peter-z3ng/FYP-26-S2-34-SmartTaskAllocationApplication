import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function EmployeeSettingsPage() {
  return (
    <SideMenuLayout actor="employee">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Employee
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Settings</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Manage your profile and notification preferences.
        </p>
      </header>
      <HomePanel
        title="Employee Settings"
        description="This page will contain profile, contact, and notification preferences."
      />
    </SideMenuLayout>
  );
}
