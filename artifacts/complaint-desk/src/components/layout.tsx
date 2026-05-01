import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon, LayoutDashboard, Settings } from "lucide-react";
import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const getDashboardLink = () => {
    switch (user.role) {
      case "admin": return "/admin";
      case "staff": return "/staff";
      default: return "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar border-sidebar-border h-screen sticky top-0">
        <div className="p-6 border-b border-sidebar-border">
          <Link href={getDashboardLink()} className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">C</span>
            </div>
            CampusDesk
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href={getDashboardLink()}>
            <Button
              variant={location.startsWith(getDashboardLink()) ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <Link href={getDashboardLink()} className="flex items-center gap-2 font-bold text-lg">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-xs">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          CampusDesk
        </Link>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
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
