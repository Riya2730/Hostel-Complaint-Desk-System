import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart3,
  Users,
  ListChecks,
  MapPin,
  Search,
  UserPlus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useGetComplaints,
  getGetComplaintsQueryKey,
  useGetComplaintStats,
  getGetComplaintStatsQueryKey,
  useGetUsers,
  getGetUsersQueryKey,
  useChangeUserRole,
  useGetStaffList,
  getGetStaffListQueryKey,
  useUpdateComplaint,
  ChangeRoleBodyRole,
} from "@workspace/api-client-react";
import { StatusBadge, PriorityBadge } from "@/components/badges";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading: statsLoading } = useGetComplaintStats({
    query: { enabled: !!token, queryKey: getGetComplaintStatsQueryKey() },
  });

  const { data: complaints, isLoading: complaintsLoading } = useGetComplaints(undefined, {
    query: { enabled: !!token, queryKey: getGetComplaintsQueryKey() },
  });

  const { data: users, isLoading: usersLoading } = useGetUsers({
    query: { enabled: !!token, queryKey: getGetUsersQueryKey() },
  });

  const { data: staffList } = useGetStaffList({
    query: { enabled: !!token, queryKey: getGetStaffListQueryKey() },
  });

  const changeRoleMutation = useChangeUserRole();
  const updateStatusMutation = useUpdateComplaint();

  const handleAssign = (complaintId: number, staffIdStr: string) => {
    const staffId = parseInt(staffIdStr, 10);
    if (isNaN(staffId)) return;
    fetch(`${import.meta.env.BASE_URL}api/admin/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintId, staffId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        toast({ title: "Complaint assigned successfully" });
        queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
      })
      .catch(() => toast({ title: "Failed to assign complaint", variant: "destructive" }));
  };

  const handleChangeRole = (userId: number, newRole: ChangeRoleBodyRole) => {
    changeRoleMutation.mutate(
      { userId, data: { role: newRole } },
      {
        onSuccess: () => {
          toast({ title: "User role updated" });
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStaffListQueryKey() });
        },
        onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
      },
    );
  };

  const handleStatusChange = (complaintId: number, status: "pending" | "in_progress" | "resolved") => {
    updateStatusMutation.mutate(
      { id: complaintId, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetComplaintStatsQueryKey() });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      },
    );
  };

  const filteredComplaints = complaints?.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-muted-foreground">Manage complaints, oversee operations, and administer users.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="overview"><BarChart3 className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="complaints"><ListChecks className="mr-2 h-4 w-4" />Complaints</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Complaints</CardTitle><ListChecks className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.resolved}</div><Progress value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0} className="mt-2" /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle><Clock className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><AlertCircle className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent></Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader><CardTitle>By Category</CardTitle></CardHeader><CardContent><div className="space-y-4">{stats.byCategory.map((cat, i) => <div key={i} className="flex items-center"><div className="w-[100px] text-sm font-medium capitalize truncate">{cat.category}</div><div className="flex-1 ml-4"><Progress value={stats.total > 0 ? (cat.count / stats.total) * 100 : 0} className="h-2" /></div><div className="ml-4 w-8 text-right text-sm text-muted-foreground">{cat.count}</div></div>)}</div></CardContent></Card>
                <Card><CardHeader><CardTitle>By Priority</CardTitle></CardHeader><CardContent><div className="space-y-4">{stats.byPriority.map((pri, i) => <div key={i} className="flex items-center"><div className="w-[100px] text-sm font-medium capitalize truncate">{pri.priority}</div><div className="flex-1 ml-4"><Progress value={stats.total > 0 ? (pri.count / stats.total) * 100 : 0} className={`h-2 ${pri.priority === "high" ? "[&>div]:bg-destructive" : pri.priority === "medium" ? "[&>div]:bg-orange-500" : ""}`} /></div><div className="ml-4 w-8 text-right text-sm text-muted-foreground">{pri.count}</div></div>)}</div></CardContent></Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="complaints" className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm"><Search className="h-4 w-4 text-muted-foreground absolute ml-3" /><Input placeholder="Search by title, location, or user..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="grid gap-4">
            {complaintsLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />) : filteredComplaints?.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground"><ListChecks className="h-12 w-12 mb-4 opacity-20" /><p className="text-lg font-medium">No complaints found</p></CardContent></Card> : filteredComplaints?.map((complaint) => <Card key={complaint.id} className="overflow-hidden"><div className="flex flex-col sm:flex-row"><div className="flex-1 p-4 md:p-6"><div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-lg">{complaint.title}</h3><PriorityBadge priority={complaint.priority} /></div><div className="flex items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><UserPlus className="h-3 w-3" /> {complaint.userName || `User #${complaint.userId}`}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {complaint.location}</span><span>{format(new Date(complaint.createdAt), "MMM d")}</span></div></div><StatusBadge status={complaint.status} /></div><p className="text-sm mt-3 text-foreground/80 line-clamp-2">{complaint.description}</p></div><div className="bg-muted/30 p-4 md:p-6 sm:w-64 border-t sm:border-t-0 sm:border-l flex flex-col gap-4"><div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground uppercase">Assign To</label><Select value={complaint.assignedTo?.toString() || "unassigned"} onValueChange={(val) => val !== "unassigned" && handleAssign(complaint.id, val)}><SelectTrigger className="h-8"><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{staffList?.map((staff) => <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground uppercase">Status</label><Select value={complaint.status} onValueChange={(val) => handleStatusChange(complaint.id, val as "pending" | "in_progress" | "resolved")} disabled={updateStatusMutation.isPending}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></div></div></div></Card>)}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>Change roles and keep access under control.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_1fr_100px_160px] gap-4 p-4 font-medium text-sm text-muted-foreground border-b bg-muted/50"><div>User</div><div>Email</div><div>Joined</div><div>Role</div></div>
                <div className="divide-y">
                  {usersLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-6 w-full" /></div>) : users?.map((u) => <div key={u.id} className="grid grid-cols-[1fr_1fr_100px_160px] gap-4 p-4 items-center text-sm hover:bg-muted/30 transition-colors"><div className="flex items-center gap-3 overflow-hidden"><Avatar className="h-8 w-8"><AvatarFallback className={u.role === "admin" ? "bg-purple-100 text-purple-700" : u.role === "staff" ? "bg-blue-100 text-blue-700" : ""}>{u.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-medium truncate">{u.name}</span></div><div className="truncate text-muted-foreground">{u.email}</div><div className="text-muted-foreground">{format(new Date(u.createdAt), "MMM yyyy")}</div><div><Select value={u.role} onValueChange={(val: ChangeRoleBodyRole) => handleChangeRole(u.id, val)} disabled={changeRoleMutation.isPending}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div></div>)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
