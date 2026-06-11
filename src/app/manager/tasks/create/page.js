import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function ManagerCreateTaskPage() {
  return <DashboardFeaturePage actor="manager" feature={featureCatalog.managerCreateTask} />;
}
