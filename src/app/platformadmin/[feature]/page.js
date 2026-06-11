import { notFound } from "next/navigation";
import DashboardFeaturePage from "@/components/DashboardFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

const featureBySlug = {
  "activity-logs": featureCatalog.activityLogs,
  homepage: featureCatalog.homepageManagement,
  subscriptions: featureCatalog.subscriptionManagement,
  feedback: featureCatalog.feedbackManagement,
  "feedback-analysis": featureCatalog.feedbackAnalysis,
  inquiries: featureCatalog.inquiryManagement,
  profile: featureCatalog.platformProfile,
};

export default async function PlatformAdminFeaturePage({ params }) {
  const { feature } = await params;
  const config = featureBySlug[feature];

  if (!config) {
    notFound();
  }

  return <DashboardFeaturePage actor="platformadmin" feature={config} />;
}
