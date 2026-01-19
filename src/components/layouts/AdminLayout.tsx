import { Outlet, Link, NavLink } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Briefcase, Building, ClipboardList, BarChart, Settings, LogOut, Menu, X, Target, DollarSign, ClipboardCheck, LifeBuoy, Sun, Moon, Bell, Lightbulb, ChevronsLeft,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import useLocalStorage from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Oportunidades", href: "/admin/opportunities", icon: Briefcase },
  { name: "Onboarding", href: "/admin/onboarding", icon: ClipboardCheck },
  { name: "Suporte", href: "/admin/suporte", icon: LifeBuoy },
  { name: "Financeiro", href: "/admin/financeiro", icon: DollarSign },
  { name: "Metas", href: "/admin/metas", icon: Target },
  { name: "Empresas", href: "/admin/companies", icon: Building },
  { name: "Atividades", href: "/admin/activities", icon: ClipboardList },
  { name: "Relatórios", href: "/admin/reports", icon: BarChart },
  { name: "Insights", href: "/admin/insights", icon: Lightbulb },
];

const settingsNavItems = [
    { name: "Configurações", href: "/admin/settings", icon: Settings },
]

const AdminLayout = () => {
  const { profile, logout } = useSession();
  const { setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const unreadAlertsCount = 1; // Mock - virá do hook useAlerts

  const NavLinks = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <nav className="flex flex-col space-y-1 flex-grow">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 relative",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              isCollapsed && "justify-center"
            )
          }
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
          <span className={cn(isCollapsed && "hidden")}>{item.name}</span>
        </NavLink>
      ))}
      <div className="flex-grow" />
      {settingsNavItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              isCollapsed && "justify-center"
            )
          }
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
          <span className={cn(isCollapsed && "hidden")}>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-64 bg-card border-r border-border p-4 flex flex-col">
          <div className="flex items-center justify-between mb-6 h-8">
            <Link to="/admin" className="flex items-center h-full">
              <img src="/branding/Nexor SF.png" alt="Nexor" className="h-auto w-full max-w-[140px]" />
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>
          <NavLinks isCollapsed={false} />
        </div>
        <div className="flex-shrink-0 w-14 bg-black/30" onClick={() => setSidebarOpen(false)}></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex md:flex-col bg-card border-r border-border p-4 transition-all duration-300 ease-in-out", isCollapsed ? "w-20" : "w-64")}>
        <div className={cn("flex items-center justify-center mb-8 h-8 transition-all duration-300", isCollapsed ? "px-0" : "px-2")}>
          <Link to="/admin" className="transition-transform duration-300 hover:scale-105">
            <img 
              src={isCollapsed ? "/branding/Nexor - SF2.png" : "/branding/Nexor SF.png"} 
              alt="Nexor" 
              className={cn("transition-all duration-300", isCollapsed ? "h-8 w-8" : "h-auto w-full max-w-[140px]")}
            />
          </Link>
        </div>
        <NavLinks isCollapsed={isCollapsed} />
        <Button variant="ghost" onClick={() => setIsCollapsed(!isCollapsed)} className="mt-4 text-muted-foreground hover:text-foreground">
          <ChevronsLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </Button>
      </aside>

      <div className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out", isCollapsed ? "md:ml-20" : "md:ml-64")}>
        <header className="flex items-center justify-between p-4 bg-card border-b border-border md:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <Link to="/admin/alertas" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-6 h-6" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-red-500 text-white text-[10px]">
                    {unreadAlertsCount}
                  </span>
                </span>
              )}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-secondary">
                  <div className="text-right">
                    <div className="text-sm font-medium">{profile?.full_name || "Usuário"}</div>
                    <div className="text-xs text-muted-foreground capitalize">{profile?.role || "Role"}</div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full" />
                    ) : (
                      <span>{profile?.full_name?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-4 bg-popover border-border text-foreground">
                <DropdownMenuLabel>
                  <div className="font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {profile?.role || "Role"}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
                    <span>Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={logout} className="cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;