import { ShieldCheck } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/page";
export const metadata = { title: "Detections" };
export default function DetectionsPage() {
  return (
    <div>
      <PageHeader
        title="Detections"
        description="My custom Wazuh rules and what they catch."
        icon={ShieldCheck}
      />
      <EmptyState
        icon={ShieldCheck}
        title="Coming together"
        description="The detections page lands next in Phase 4."
      />
    </div>
  );
}
