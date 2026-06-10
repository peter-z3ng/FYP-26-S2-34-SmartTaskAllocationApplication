import SideMenuLayout from "@/components/SideMenuLayout";
import TeamManagement from "@/components/TeamManagement";

export default function ManagerTeamPage() {
  return (
    <SideMenuLayout actor="manager">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          Manager
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Team</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Understand team skills, availability, and workload.
        </p>
      </header>
      <TeamManagement />
    </SideMenuLayout>
  );
}
