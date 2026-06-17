import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function EmployeeMySpacePage() {
  return (
    <SideMenuLayout actor="employee">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <ManagerPlaceholderPage
          eyebrow="Employee"
          title="My Space"
          description="Keep personal notes, saved work, and your own task focus area."
        />
      </GlassSurface>
    </SideMenuLayout>
  );
}
