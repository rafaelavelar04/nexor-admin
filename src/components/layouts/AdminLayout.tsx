import { Outlet, Link, NavLink } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building,
  ClipboardList,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/admin/leads", icon: Users },
  { name: "Oportunidades", href: "/admin/opportunities", icon: Briefcase },
  { name: "Empresas", href: "/admin/companies", icon: Building },
  { name: "Atividades", href: "/admin/activities", icon: ClipboardList },
  { name: "Relatórios", href: "/admin/reports", icon: BarChart },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { profile, logout } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavLinks = () => (
    <nav className="flex flex-col space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-cyan-500/10 text-cyan-400"
                : "text-gray-400 hover:bg-gray-700 hover:text-white"
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 flex transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <Link to="/admin" className="flex items-center gap-3 text-xl font-bold text-white">
              <img src="/branding/Nexor - SF2.png" alt="Nexor Icon" className="w-8 h-8" />
              <span>Nexor Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <NavLinks />
        </div>
        <div className="flex-shrink-0 w-14" onClick={() => setSidebarOpen(false)}></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-800 border-r border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-8">
          <img src="/branding/Nexor - SF2.png" alt="Nexor Icon" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-white">Nexor Admin</h1>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 md:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <span>{profile?.full_name || "Usuário"}</span>
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full" />
                  ) : (
                    <span>{profile?.full_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 bg-gray-800 border-gray-700 text-white">
              <DropdownMenuLabel>
                <div className="font-medium">{profile?.full_name}</div>
                <div className="text-xs text-gray-400 capitalize">
                  {profile?.roles?.join(", ") || "Role"}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={logout} className="cursor-pointer focus:bg-gray-700">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;