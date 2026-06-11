import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function UserAdminSupportPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.userAdminSupport} />;
}
