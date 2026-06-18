import PublicFeedbackPageContent from "@/components/PublicFeedbackPageContent";

export const metadata = {
  title: "User Feedback | Optima",
  description: "Read customer feedback and testimonials for Optima.",
};

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  return <PublicFeedbackPageContent />;
}
