import GuestFeaturePage from "@/components/GuestFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function GuestContactPage() {
  return <GuestFeaturePage feature={featureCatalog.guestContact} />;
}
