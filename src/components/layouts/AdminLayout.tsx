import { Outlet, Link, NavLink } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Briefcase, Building, ClipboardList, BarChart, Settings, LogOut, Menu, X, Target, DollarSign, ClipboardCheck, LifeBuoy, Sun, Moon, Bell,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Alertas", href: "/admin/alertas", icon: Bell },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Oportunidades", href: "/admin/opportunities", icon: Briefcase },
  { name: "Onboarding", href: "/admin/onboarding", icon: ClipboardCheck },
  { name: "Suporte", href: "/admin/suporte", icon: LifeBuoy },
  { name: "Financeiro", href: "/admin/financeiro", icon: DollarSign },
  { name: "Metas", href: "/admin/metas", icon: Target },
  { name: "Empresas", href: "/admin/companies", icon: Building },
  { name: "Atividades", href: "/admin/activities", icon: ClipboardList },
  { name: "Relatórios", href: "/admin/reports", icon: BarChart },
];

const settingsNavItems = [
    { name: "Configurações", href: "/admin/settings", icon: Settings },
]

const AdminLayout = () => {
  const { profile, logout } = useSession();
  const { setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadAlertsCount = 1; // Mock - virá do hook useAlerts

  const NavLinks = () => (
    <nav className="flex flex-col space-y-1 flex-grow">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 relative ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <span>{item.name}</span>
          {item.name === 'Alertas' && unreadAlertsCount > 0 && (
            <span className="absolute left-7 top-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </NavLink>
      ))}
      <div className="flex-grow" />
      {settingsNavItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <item.icon className="w-5 h-5 mr-3" />
          {item.name}
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
          <div className="flex items-center justify-between mb-6">
            <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-foreground">
              <img src="/branding/Nexor - SF2.png" alt="Nexor Icon" className="w-8 h-8" />
              <span>Nexor Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>
          <NavLinks />
        </div>
        <div className="flex-shrink-0 w-14 bg-black/30" onClick={() => setSidebarOpen(false)}></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-card border-r border-border p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/branding/Nexor - SF2.png" alt="Nexor Icon" className="w-8 h-8" />
          <h1 className="text-lg font-bold text-foreground">Nexor Admin</h1>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
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