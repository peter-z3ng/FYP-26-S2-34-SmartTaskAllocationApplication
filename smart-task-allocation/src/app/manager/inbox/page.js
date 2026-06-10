import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function ManagerInboxPage() {
  return (
    <SideMenuLayout actor="manager">
      <ManagerPlaceholderPage
        eyebrow="Manager"
        title="Inbox"
        description="Review task activity, employee requests, assignment updates, and team notifications."
      >
        <div className="rounded-2xl border border-white/60 bg-[#f8faff] p-5 text-sm font-semibold text-[#52627a]">
          Live task requests and assignment alerts are also surfaced from the top notification center.
        </div>
      </ManagerPlaceholderPage>
    </SideMenuLayout>
  );
}
