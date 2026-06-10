import SideMenuLayout from "@/components/SideMenuLayout";
import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";

export default function ManagerSupportPage() {
  return (
    <SideMenuLayout actor="manager">
      <div className="absolute inset-0 flex items-center justify-center text-6xl border border-white/60 bg-white/20 backdrop-blur-md font-bold text-[#0D1E4C]">Coming Soon</div>
      <ManagerPlaceholderPage
        eyebrow="Manager"
        title="Support"
        description="Find help, report issues, and access operational support resources."
      />
    </SideMenuLayout>
  );
}
