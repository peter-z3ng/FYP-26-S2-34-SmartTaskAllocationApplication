import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function UserAdminHomePage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.userAdminDashboard} />;
}
