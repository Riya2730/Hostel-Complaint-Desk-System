import { Badge } from "@/components/ui/badge";
import { ComplaintStatus } from "@workspace/api-client-react";

export function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">In Progress</Badge>;
    case "resolved":
      return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Resolved</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return null;
  
  switch (priority.toLowerCase()) {
    case "high":
      return <Badge variant="destructive" className="font-semibold shadow-sm">High</Badge>;
    case "medium":
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}
