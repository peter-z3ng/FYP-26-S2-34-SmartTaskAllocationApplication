import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function AccountStatusPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.statusUserAccount} />;
}
