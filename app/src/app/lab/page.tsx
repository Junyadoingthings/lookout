import { FlaskConical } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/page";
export const metadata = { title: "Lab" };
export default function LabPage() {
  return (
    <div>
      <PageHeader title="Lab" description="How the home SOC is built." icon={FlaskConical} />
      <EmptyState
        icon={FlaskConical}
        title="Coming together"
        description="The lab page and architecture diagram land next in Phase 4."
      />
    </div>
  );
}
