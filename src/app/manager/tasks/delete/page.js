import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function ManagerDeleteTaskPage() {
  return <DashboardFeaturePage actor="manager" feature={featureCatalog.managerDeleteTask} />;
}
