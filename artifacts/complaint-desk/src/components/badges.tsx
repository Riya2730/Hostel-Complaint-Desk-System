import { Badge } from "@/components/ui/badge";
import { ComplaintStatus } from "@workspace/api-client-react";

export function StatusBadge({ status }: { status: ComplaintStatus | string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Pending</Badge>;
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/30">In Progress</Badge>;
    case "resolved":
      return <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/30">Resolved</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return null;

  switch (priority.toLowerCase()) {
    case "critical":
      return <Badge className="bg-red-600 text-white border-red-700 font-bold shadow-sm">Critical</Badge>;
    case "high":
      return <Badge variant="destructive" className="font-semibold shadow-sm">High</Badge>;
    case "medium":
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/30">Medium</Badge>;
    case "low":
      return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "admin":
      return <Badge className="bg-purple-600 text-white text-xs">Admin</Badge>;
    case "staff":
      return <Badge className="bg-blue-600 text-white text-xs">Staff</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Student</Badge>;
  }
}
