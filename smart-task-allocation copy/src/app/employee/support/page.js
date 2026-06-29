import ManagerPlaceholderPage from "@/components/ManagerPlaceholderPage";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function EmployeeSupportPage() {
  return (
    <SideMenuLayout actor="employee">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <ManagerPlaceholderPage
          eyebrow="Employee"
          title="Support"
          description="Get help with assignments, workspace access, and account questions."
        />
      </GlassSurface>
    </SideMenuLayout>
  );
}
