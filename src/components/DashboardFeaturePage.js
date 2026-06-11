import FeaturePage from "@/components/FeaturePage";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function DashboardFeaturePage({ actor, feature }) {
  return (
    <SideMenuLayout actor={actor}>
      <FeaturePage {...feature} />
    </SideMenuLayout>
  );
}
