import SideMenuLayout from "@/components/SideMenuLayout";
import TimeClockPanel from "@/components/TimeClockPanel";

export default function EmployeeClockPage() {
  return (
    <SideMenuLayout actor="employee">
      <section className="h-full min-h-0 overflow-y-auto rounded-2xl border border-[#BBE1FA] bg-[#f8fbff] p-6 shadow-sm">
        <div className="mb-6 border-b border-[#d6deed] pb-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5e7191]">My work status</p>
          <h1 className="mt-3 text-3xl font-black text-[#07183b]">Clock In / Clock Out</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#52627a]">
            Use this page to manage your availability for task assignment and review your recent time clock activity.
          </p>
        </div>

        <TimeClockPanel />
      </section>
    </SideMenuLayout>
  );
}
