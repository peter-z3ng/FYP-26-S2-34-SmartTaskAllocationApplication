import PlatformAdminSettings from "@/components/PlatformAdminSettings";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function PlatformAdminSettingsPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Platform Admin
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Settings</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Manage your profile and platform administration preferences.
        </p>
      </header>
      <PlatformAdminSettings />
    </SideMenuLayout>
  );
}
