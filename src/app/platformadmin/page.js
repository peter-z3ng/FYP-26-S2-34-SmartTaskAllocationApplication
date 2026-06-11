import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function PlatformAdminHomePage() {
  return <DashboardFeaturePage actor="platformadmin" feature={featureCatalog.platformDashboard} />;
}
