import SideMenuLayout from "@/components/SideMenuLayout";
import { FeedbackAnalysis } from "@/components/PlatformAdminPrdPages";

export default function FeedbackAnalysisPage() {
  return (
    <SideMenuLayout actor="platformadmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">Platform Admin</p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Feedback Analysis</h1>
        <p className="mt-2 text-sm text-[#52627a]">Analyse user opinions and identify recurring themes.</p>
      </header>
      <FeedbackAnalysis />
    </SideMenuLayout>
  );
}
