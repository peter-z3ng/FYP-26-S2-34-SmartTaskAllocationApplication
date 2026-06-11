import GuestFeaturePage from "@/components/GuestFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function GuestMarketingPage() {
  return <GuestFeaturePage feature={featureCatalog.guestMarketing} />;
}
