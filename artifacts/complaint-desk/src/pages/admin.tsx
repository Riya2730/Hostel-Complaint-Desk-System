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
  RefreshCw,
  ShieldAlert,
  X,
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
import { StatusBadge, PriorityBadge, RoleBadge } from "@/components/badges";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingRoleChange = { userId: number; userName: string; currentRole: string; newRole: ChangeRoleBodyRole };
type PendingAssign = { complaintId: number; complaintTitle: string; staffId: number; staffName: string };

export default function AdminDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);
  const [pendingAssign, setPendingAssign] = useState<PendingAssign | null>(null);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetComplaintStats({
    query: { enabled: !!token, queryKey: getGetComplaintStatsQueryKey() },
  });

  const {
    data: complaints,
    isLoading: complaintsLoading,
    isRefetching: complaintsRefetching,
    refetch: refetchComplaints,
    error: complaintsError,
  } = useGetComplaints(undefined, {
    query: { enabled: !!token, queryKey: getGetComplaintsQueryKey() },
  });

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useGetUsers({
    query: { enabled: !!token, queryKey: getGetUsersQueryKey() },
  });

  const { data: staffList } = useGetStaffList({
    query: { enabled: !!token, queryKey: getGetStaffListQueryKey() },
  });

  const changeRoleMutation = useChangeUserRole();
  const updateStatusMutation = useUpdateComplaint();

  const confirmAssign = () => {
    if (!pendingAssign) return;
    const { complaintId, staffId } = pendingAssign;
    setAssignError(null);
    setAssigningId(complaintId);
    setPendingAssign(null);

    fetch(`/api/admin/assign`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ complaintId, staffId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed with status ${res.status}`);
        }
        toast({ title: "Complaint assigned", description: `Assigned to ${pendingAssign?.staffName ?? "staff"}.` });
        queryClient.invalidateQueries({ queryKey: getGetComplaintsQueryKey() });
      })
      .catch((err: Error) => {
        setAssignError(err.message);
        toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
      })
      .finally(() => setAssigningId(null));
  };

  const confirmRoleChange = () => {
    if (!pendingRoleChange) return;
    const { userId, newRole } = pendingRoleChange;
    setPendingRoleChange(null);

    changeRoleMutation.mutate(
      { userId, data: { role: newRole } },
      {
        onSuccess: () => {
          toast({ title: "Role updated", description: `User role changed to ${newRole}.` });
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStaffListQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Role change failed",
            description: err?.data?.error ?? err?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
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
        onError: (err: any) => {
          toast({
            title: "Status update failed",
            description: err?.data?.error ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const filteredComplaints = complaints?.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      (c.userName ?? "").toLowerCase().includes(q) ||
      (c.categoryUser ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground">
            Manage complaints, assign staff, and administer users.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            refetchComplaints();
            refetchStats();
          }}
          disabled={complaintsRefetching}
          title="Refresh all"
        >
          <RefreshCw className={`h-4 w-4 ${complaintsRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Confirmation: Role Change */}
      <AlertDialog open={!!pendingRoleChange} onOpenChange={(open) => !open && setPendingRoleChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change <strong>{pendingRoleChange?.userName}</strong>'s role from{" "}
              <strong className="capitalize">{pendingRoleChange?.currentRole}</strong> to{" "}
              <strong className="capitalize">{pendingRoleChange?.newRole}</strong>.
              <br /><br />
              This will immediately affect what this user can access. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleChange}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation: Assign Complaint */}
      <AlertDialog open={!!pendingAssign} onOpenChange={(open) => !open && setPendingAssign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Assign <strong>"{pendingAssign?.complaintTitle}"</strong> to{" "}
              <strong>{pendingAssign?.staffName}</strong>?
              <br /><br />
              The staff member will be notified via email and the complaint status will be updated to
              "In Progress".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssign} disabled={assigningId !== null}>
              {assigningId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />Overview
          </TabsTrigger>
          <TabsTrigger value="complaints">
            <ListChecks className="mr-2 h-4 w-4" />Complaints
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />Users
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <Progress
                      value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}
                      className="mt-2 h-1.5"
                    />
                  </CardContent>
                </Card>
                <Card className="border-blue-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.byCategory.map((cat, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium capitalize truncate">{cat.category}</div>
                          <div className="flex-1">
                            <Progress
                              value={stats.total > 0 ? (cat.count / stats.total) * 100 : 0}
                              className="h-2"
                            />
                          </div>
                          <div className="w-6 text-right text-sm text-muted-foreground font-mono">{cat.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.byPriority.map((pri, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium capitalize truncate">{pri.priority}</div>
                          <div className="flex-1">
                            <Progress
                              value={stats.total > 0 ? (pri.count / stats.total) * 100 : 0}
                              className={`h-2 ${
                                pri.priority === "critical"
                                  ? "[&>div]:bg-red-600"
                                  : pri.priority === "high"
                                  ? "[&>div]:bg-destructive"
                                  : pri.priority === "medium"
                                  ? "[&>div]:bg-orange-500"
                                  : ""
                              }`}
                            />
                          </div>
                          <div className="w-6 text-right text-sm text-muted-foreground font-mono">{pri.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ── Complaints ── */}
        <TabsContent value="complaints" className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search by title, student name, location, or category..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredComplaints?.length ?? 0} result{filteredComplaints?.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {assignError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{assignError}</AlertDescription>
            </Alert>
          )}

          {complaintsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load complaints. Please refresh.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {complaintsLoading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
            ) : filteredComplaints?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <ListChecks className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No complaints found</p>
                  {searchQuery && (
                    <p className="text-sm">Try a different search term.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredComplaints?.map((complaint) => (
                <Card
                  key={complaint.id}
                  className={`overflow-hidden transition-all duration-200 border-l-4 ${
                    complaint.priority === "critical"
                      ? "border-l-red-600"
                      : complaint.priority === "high"
                      ? "border-l-destructive"
                      : complaint.priority === "medium"
                      ? "border-l-orange-400"
                      : "border-l-border"
                  } ${assigningId === complaint.id ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Left: Complaint Details */}
                    <div className="flex-1 p-5 md:p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-lg leading-tight">{complaint.title}</h3>
                            <PriorityBadge priority={complaint.priority} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              {complaint.userName ?? `User #${complaint.userId}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {complaint.location}
                            </span>
                            <span>{format(new Date(complaint.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>

                      <p className="text-sm text-foreground/80 mt-3 line-clamp-2 leading-relaxed">
                        {complaint.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="border px-2 py-1 rounded-md capitalize bg-background">
                          {complaint.categoryUser}
                        </span>
                        {complaint.categoryAi && complaint.categoryAi !== complaint.categoryUser && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                            AI: {complaint.categoryAi}
                          </span>
                        )}
                        {complaint.assignedToName && (
                          <span className="ml-auto border px-2 py-1 rounded-md text-muted-foreground">
                            Assigned: <strong>{complaint.assignedToName}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="bg-muted/20 p-5 md:p-6 sm:w-64 border-t sm:border-t-0 sm:border-l space-y-4">
                      {/* Assign Staff */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Assign To
                        </label>
                        {assigningId === complaint.id ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground h-9 px-3 border rounded-md bg-background">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Assigning...
                          </div>
                        ) : (
                          <Select
                            value={complaint.assignedTo?.toString() ?? "unassigned"}
                            onValueChange={(val) => {
                              if (val === "unassigned") return;
                              const staff = staffList?.find((s) => s.id.toString() === val);
                              if (!staff) return;
                              setPendingAssign({
                                complaintId: complaint.id,
                                complaintTitle: complaint.title,
                                staffId: staff.id,
                                staffName: staff.name,
                              });
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {staffList?.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id.toString()}>
                                  {staff.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Status Controls */}
                      {complaint.status !== "resolved" && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Status
                          </label>
                          <div className="grid gap-2">
                            {complaint.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => handleStatusChange(complaint.id, "in_progress")}
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <Clock className="mr-1.5 h-3 w-3" />
                                )}
                                In Progress
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleStatusChange(complaint.id, "resolved")}
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                              )}
                              Resolve
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Users ── */}
        <TabsContent value="users" className="space-y-4">
          {usersError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load users. Please refresh the page.</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>
                Change roles to control what each user can access. Role changes take effect immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4} className="p-4">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      users?.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback
                                  className={
                                    u.role === "admin"
                                      ? "bg-purple-100 text-purple-700 text-xs"
                                      : u.role === "staff"
                                      ? "bg-blue-100 text-blue-700 text-xs"
                                      : "bg-primary/10 text-primary text-xs"
                                  }
                                >
                                  {u.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{u.name}</p>
                                <p className="text-xs text-muted-foreground truncate sm:hidden">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden sm:table-cell">
                            <span className="truncate block max-w-[200px]">{u.email}</span>
                          </td>
                          <td className="p-4 text-muted-foreground hidden md:table-cell">
                            {format(new Date(u.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="p-4">
                            <Select
                              value={u.role}
                              onValueChange={(val: ChangeRoleBodyRole) => {
                                if (val === u.role) return;
                                setPendingRoleChange({
                                  userId: u.id,
                                  userName: u.name,
                                  currentRole: u.role,
                                  newRole: val,
                                });
                              }}
                              disabled={changeRoleMutation.isPending}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
