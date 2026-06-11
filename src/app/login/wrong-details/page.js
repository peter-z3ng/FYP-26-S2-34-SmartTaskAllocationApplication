import GuestFeaturePage from "@/components/GuestFeaturePage";
import { featureCatalog } from "@/lib/featureCatalog";

export default function WrongLoginDetailsPage() {
  return <GuestFeaturePage feature={featureCatalog.wrongLogin} />;
}
