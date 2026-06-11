import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function RolePermissionsPage() {
  return <DashboardFeaturePage actor="useradmin" feature={featureCatalog.rolePermissions} />;
}
