import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function UpdateUserAccountPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.updateUserAccount} />;
}
