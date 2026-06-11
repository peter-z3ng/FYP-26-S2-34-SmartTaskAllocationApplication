import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function AssignRolesPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.assignRoles} />;
}
