import {
  LayoutDashboard, FileText, ClipboardList, Users, Car, Calendar,
  DollarSign, Package, BarChart3, Settings, LogOut, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import glosshubLogo from "@/assets/glosshub-logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Propostas", url: "/propostas", icon: FileText },
  { title: "Protocolos", url: "/protocolos", icon: ClipboardList },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Car },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const roleLabels: Record<string, string> = {
  admin_master: "Admin Master",
  gerente: "Gerente",
  consultor: "Consultor",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut, profile, roles } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const primaryRole = roles[0];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-center border-b border-border">
          {!collapsed ? (
            <img src={glosshubLogo} alt="GlossHub" className="h-8 object-contain" />
          ) : (
            <span className="text-primary font-bold text-lg">G</span>
          )}
        </div>

        {!collapsed && profile && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{profile.full_name || profile.email}</p>
            {primaryRole && (
              <Badge variant="outline" className="mt-1 text-xs border-primary/50 text-primary">
                {roleLabels[primaryRole] || primaryRole}
              </Badge>
            )}
          </div>
        )}

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="p-2 border-t border-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Sair</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
