import GuestFeaturePage from "@/components/GuestFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function GuestPricingPage() {
  return <GuestFeaturePage feature={featureCatalog.guestPricing} />;
}
