import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerMySpacePage() {
  return (
    <SideMenuLayout actor="manager">
      <section className="manager-reference-panel min-h-[620px] rounded-2xl border border-[#BBE1FA] bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5d7290]">
          Manager
        </p>
        <h1 className="mt-2 text-4xl font-black text-[#07183b]">My Space</h1>
        <p className="mt-3 max-w-2xl text-base font-medium text-[#52627a]">
          Manage personal profile details, avatar review status, and account alerts.
        </p>
        <div className="mt-8">
          <ProfileSettingsForm />
        </div>
      </section>
    </SideMenuLayout>
  );
}
