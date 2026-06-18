// Stable feature keys are shared by pricing copy, API guards, and paid-feature dashboards.
export const PAID_FEATURES = [
  {
    key: "smartAllocation",
    title: "Smart allocation",
    description: "Automatically ranks eligible employees and assigns the best match for a selected task.",
  },
  {
    key: "availabilityChecks",
    title: "Availability checks",
    description: "Checks availability windows, schedule conflicts, account status, skills, and qualifications before allocation.",
  },
  {
    key: "requestApproval",
    title: "Request approval",
    description: "Lets managers approve or reject employee task requests with the same eligibility checks used for assignment.",
  },
  {
    key: "aiRecommendations",
    title: "AI recommendations",
    description: "Generates explainable recommendation summaries from task fit, workload, conflicts, and eligibility signals.",
  },
  {
    key: "prioritySupport",
    title: "Priority support",
    description: "Marks support inquiries as priority so Platform Admin can handle paid customers first.",
  },
  {
    key: "customReporting",
    title: "Custom reporting",
    description: "Provides paid users with task coverage, request, completion, and team plan reports.",
  },
];

export function normalizeUserTier(value) {
  const normalized = String(value || "Free").trim().toLowerCase();
  return ["paid", "paid pro", "pro", "team", "enterprise"].includes(normalized) ? "Paid" : "Free";
}

export function isPaidTier(value) {
  return normalizeUserTier(value) === "Paid";
}

export function paidFeatureError(featureTitle) {
  return `${featureTitle} is available for Paid Pro users.`;
}

export function getPaidFeature(key) {
  return PAID_FEATURES.find((feature) => feature.key === key) ?? null;
}
