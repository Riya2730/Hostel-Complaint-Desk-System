import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  MapPin, 
  Search, 
  User as UserIcon,
  CheckCircle,
  Clock,
  MessageSquare
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import {
  useGetComplaints,
  getGetComplaintsQueryKey,
  useUpdateComplaint,
  ComplaintStatus
} from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const { data: complaints, isLoading } = useGetComplaints(undefined, {
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
          toast({ title: "Status updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  // Staff only sees complaints assigned to them, but the API should filter it. 
  // We'll filter on frontend just in case, but assume API handles it for staff role.
  const myTasks = complaints?.filter(c => c.assignedTo === user?.id) || [];
  
  const filteredTasks = myTasks.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = myTasks.filter(c => c.status === "pending").length;
  const inProgressCount = myTasks.filter(c => c.status === "in_progress").length;
  const resolvedCount = myTasks.filter(c => c.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Tasks</h1>
        <p className="text-muted-foreground">Manage your assigned campus issues and update their status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
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
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">You have no tasks matching this criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={`overflow-hidden transition-all duration-200 border-l-4 ${
              task.status === 'resolved' ? 'border-l-green-500 opacity-75' : 
              task.priority === 'high' ? 'border-l-destructive' : 
              task.priority === 'medium' ? 'border-l-orange-500' : 'border-l-border'
            }`}>
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-4 md:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> {task.userName}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground/70">
                          <MapPin className="h-3 w-3" /> {task.location}
                        </span>
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  
                  <p className="text-sm mt-3 text-foreground/80 bg-muted/30 p-3 rounded-md">
                    {task.description}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize border px-2 py-1 rounded-sm">
                      {task.categoryUser}
                    </span>
                    <span>Reported: {format(new Date(task.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
                
                <div className="bg-muted/10 p-4 md:p-6 sm:w-64 border-t sm:border-t-0 sm:border-l flex flex-col justify-center gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</label>
                    <div className="mb-3">
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  
                  {task.status !== 'resolved' && (
                    <div className="space-y-2 mt-auto">
                      <p className="text-xs font-medium">Update to:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {task.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            disabled={updateMutation.isPending}
                          >
                            In Progress
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className={`${task.status === 'pending' ? '' : 'col-span-2'} w-full text-green-600 border-green-200 hover:bg-green-50`}
                          onClick={() => handleStatusChange(task.id, 'resolved')}
                          disabled={updateMutation.isPending}
                        >
                          Resolved
                        </Button>
                      </div>
                    </div>
                  )}

                  {task.status === 'resolved' && task.feedbackRating && (
                    <div className="mt-auto p-3 bg-background rounded border">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-semibold">User Feedback</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic line-clamp-2">"{task.feedback}"</p>
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
