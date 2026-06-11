import { notFound } from "next/navigation";
import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

const featureBySlug = {
  "assigned-tasks": featureCatalog.employeeAssignedTasks,
  "available-tasks": featureCatalog.employeeAvailableTasks,
  "task-status": featureCatalog.employeeTaskStatus,
  requests: featureCatalog.employeeMyRequests,
  "create-request": featureCatalog.employeeCreateRequest,
  "cancel-request": featureCatalog.employeeCancelRequest,
  "clock-in": featureCatalog.employeeClockIn,
  "clock-out": featureCatalog.employeeClockOut,
  feedback: featureCatalog.employeeFeedback,
  profile: featureCatalog.employeeProfile,
};

export default async function EmployeeFeaturePage({ params }) {
  const { feature } = await params;
  const config = featureBySlug[feature];

  if (!config) {
    notFound();
  }

  return <DashboardFeaturePage actor="employee" feature={config} />;
}
