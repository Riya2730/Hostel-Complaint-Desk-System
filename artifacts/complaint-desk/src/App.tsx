import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    window.location.href = "/role";
    return null;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-destructive font-bold text-2xl">Access Denied</div>;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={RoleSelection} />
        <Route path="/role" component={RoleSelection} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} allowedRoles={["student", "admin", "staff"]} />} />
        <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />} />
        <Route path="/staff" component={() => <ProtectedRoute component={StaffDashboard} allowedRoles={["staff", "admin"]} />} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
