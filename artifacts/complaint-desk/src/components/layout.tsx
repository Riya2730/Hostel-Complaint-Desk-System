import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <>{children}</>;

  const getDashboardLink = () => {
    switch (user.role) {
      case "admin": return "/admin";
      case "staff": return "/staff";
      default: return "/dashboard";
    }
  };

  const dashboardLink = getDashboardLink();
  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link
          href={dashboardLink}
          className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-sidebar-primary-foreground font-bold text-sm">C</span>
          </div>
          CampusDesk
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href={dashboardLink} onClick={() => setMobileOpen(false)}>
          <Button
            variant={isActive(dashboardLink) ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {user.role === "admin" ? "Admin Console" : user.role === "staff" ? "My Tasks" : "My Complaints"}
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback
              className={cn(
                "text-sm font-semibold",
                user.role === "admin" && "bg-purple-100 text-purple-700",
                user.role === "staff" && "bg-blue-100 text-blue-700",
                user.role === "student" && "bg-primary/10 text-primary",
              )}
            >
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <RoleBadge role={user.role} />
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar border-sidebar-border h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (slide-in) */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-sidebar border-r border-sidebar-border shadow-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
        <button
          className="p-1 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href={dashboardLink} className="flex items-center gap-2 font-bold text-lg">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">C</span>
          </div>
          CampusDesk
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
