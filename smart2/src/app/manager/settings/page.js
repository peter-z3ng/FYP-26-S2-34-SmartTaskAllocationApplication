import HomePanel from "@/components/HomePanel";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerSettingsPage() {
  return (
    <SideMenuLayout actor="manager">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Settings</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Adjust manager task coordination preferences.
        </p>
      </header>
      <HomePanel
        title="Manager Settings"
        description="This page will contain manager notification, task, and team preferences."
      />
    </SideMenuLayout>
  );
}
