import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import RoleSelection from "@/pages/role";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import StaffDashboard from "@/pages/staff";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

const ROLE_DASHBOARD: Record<string, string> = {
  admin: "/admin",
  staff: "/staff",
  student: "/dashboard",
};

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Redirect to="/role" />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Redirect to={ROLE_DASHBOARD[user.role] ?? "/role"} />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Layout>
      <Switch>
        <Route path="/">
          {isAuthenticated && user
            ? <Redirect to={ROLE_DASHBOARD[user.role] ?? "/role"} />
            : <Redirect to="/role" />}
        </Route>
        <Route path="/role" component={RoleSelection} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} allowedRoles={["student"]} />
        </Route>
        <Route path="/admin">
          <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
        </Route>
        <Route path="/staff">
          <ProtectedRoute component={StaffDashboard} allowedRoles={["staff"]} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppInner() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
