import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function UserAdminProfilePage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.userAdminProfile} />;
}
