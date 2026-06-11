import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function ManagerUpdateTaskPage() {
  return <DashboardFeaturePage actor="manager" feature={featureCatalog.managerUpdateTask} />;
}
