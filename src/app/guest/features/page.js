import GuestFeaturePage from "@/components/GuestFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function GuestFeaturesPage() {
  return <GuestFeaturePage feature={featureCatalog.guestFeatures} />;
}
