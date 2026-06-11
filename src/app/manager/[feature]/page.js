import { notFound } from "next/navigation";
import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

const featureBySlug = {
  employees: featureCatalog.managerEmployees,
  "search-employees": featureCatalog.managerSearchEmployees,
  "manual-assignment": featureCatalog.manualAssignment,
  "auto-assignment": featureCatalog.autoAssignment,
  eligibility: featureCatalog.eligibilityEvaluation,
  requests: featureCatalog.requestReview,
  history: featureCatalog.allocationHistory,
  feedback: featureCatalog.managerFeedback,
  profile: featureCatalog.managerProfile,
};

export default async function ManagerFeaturePage({ params }) {
  const { feature } = await params;
  const config = featureBySlug[feature];

  if (!config) {
    notFound();
  }

  return <DashboardFeaturePage actor="manager" feature={config} />;
}
