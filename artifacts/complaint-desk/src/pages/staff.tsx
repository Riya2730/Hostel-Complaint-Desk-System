import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  MapPin,
  Search,
  User as UserIcon,
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import {
  useGetComplaints,
  getGetComplaintsQueryKey,
  useUpdateComplaint,
  ComplaintStatus,
} from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function StaffDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: complaints, isLoading, isRefetching, refetch } = useGetComplaints(undefined, {
    query: {
      enabled: !!token,
      queryKey: getGetComplaintsQueryKey(),
    },
  });

  const updateMutation = useUpdateComplaint();

  const handleStatusChange = (complaintId: number, status: ComplaintStatus) => {
    updateMutation.mutate(
      { id: complaintId, data: { status } },
      {
        onSuccess: () => {
          toast({
            title: "Status updated",
            description: `Complaint marked as ${status.replace("_", " ")}.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update status",
            description: err?.data?.error ?? "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // API already filters complaints to only those assigned to this staff member
  const tasks = complaints ?? [];

  const filteredTasks = tasks.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = tasks.filter((c) => c.status === "pending").length;
  const inProgressCount = tasks.filter((c) => c.status === "in_progress").length;
  const resolvedCount = tasks.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            Hello, <span className="font-medium text-foreground">{user?.name}</span>. Manage your assigned issues.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by title or location..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks ({tasks.length})</SelectItem>
              <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
              <SelectItem value="in_progress">In Progress ({inProgressCount})</SelectItem>
              <SelectItem value="resolved">Resolved ({resolvedCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">
                {tasks.length === 0
                  ? "No complaints have been assigned to you yet."
                  : "Try adjusting your search or filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`overflow-hidden transition-all duration-200 border-l-4 ${
                task.status === "resolved"
                  ? "border-l-green-500 opacity-80"
                  : task.priority === "critical"
                  ? "border-l-red-600"
                  : task.priority === "high"
                  ? "border-l-destructive"
                  : task.priority === "medium"
                  ? "border-l-orange-400"
                  : "border-l-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg leading-snug">{task.title}</h3>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> {task.userName ?? "Unknown"}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground/70">
                          <MapPin className="h-3 w-3" /> {task.location}
                        </span>
                        <span>{format(new Date(task.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 bg-muted/40 p-3 rounded-lg leading-relaxed line-clamp-3">
                    {task.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="border px-2 py-1 rounded-md capitalize bg-background">
                      {task.categoryUser}
                    </span>
                    {task.categoryAi && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                        AI: {task.categoryAi}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/20 p-5 md:p-6 sm:w-60 border-t sm:border-t-0 sm:border-l flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Current Status
                    </p>
                    <StatusBadge status={task.status} />
                  </div>

                  {task.status !== "resolved" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Update to:</p>
                      <div className="grid gap-2">
                        {task.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleStatusChange(task.id, "in_progress")}
                            disabled={updateMutation.isPending}
                          >
                            <Clock className="mr-1.5 h-3 w-3" />
                            Mark In Progress
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleStatusChange(task.id, "resolved")}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle className="mr-1.5 h-3 w-3" />
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  )}

                  {task.status === "resolved" && task.feedbackRating && (
                    <div className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold">Student Feedback</span>
                        <span className="ml-auto text-xs font-bold text-yellow-600">
                          {"★".repeat(task.feedbackRating)}
                        </span>
                      </div>
                      {task.feedback && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          "{task.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
