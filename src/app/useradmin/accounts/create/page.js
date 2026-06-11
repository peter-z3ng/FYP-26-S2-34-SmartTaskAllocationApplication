import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function CreateUserAccountPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.createUserAccount} />;
}
