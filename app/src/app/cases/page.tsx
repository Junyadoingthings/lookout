import { FileSearch } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui/page";
export const metadata = { title: "Cases" };
export default function CasesPage() {
  return (
    <div>
      <PageHeader
        title="Cases"
        description="Group related alerts into incidents."
        icon={FileSearch}
      />
      <EmptyState
        icon={FileSearch}
        title="Coming together"
        description="Case management lands next in Phase 4."
      />
    </div>
  );
}
