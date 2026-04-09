import {
  LayoutDashboard, FileText, ClipboardList, Users, Car, Calendar,
  DollarSign, Package, BarChart3, Settings, LogOut, Crown, Sparkles,
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
        <div className="border-b border-border/70 px-4 py-4">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">Glossup</p>
                  <span className="block truncate text-base font-semibold text-sidebar-foreground">Automotive Hub</span>
                </div>
              </div>
              <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/50">Operacao</p>
                <p className="mt-1 text-sm font-medium text-sidebar-foreground">ERP da oficina</p>
                <p className="mt-1 text-xs text-sidebar-foreground/60">Ordens de servico, clientes, estoque e financeiro.</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
        </div>

        {!collapsed && profile && (
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground">
                {(profile.full_name || profile.email || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-sidebar-foreground">{profile.full_name || profile.email}</p>
                <p className="truncate text-[11px] text-sidebar-foreground/55">Acesso autenticado</p>
              </div>
            </div>
            {primaryRole && (
              <Badge variant="outline" className="mt-3 h-6 border-primary/30 bg-primary/10 px-2 text-[10px] text-primary">
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
                    <NavLink to={item.url} end={item.url === "/"} className="rounded-xl text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-primary/12 text-primary font-medium shadow-sm ring-1 ring-primary/20">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {roles.includes("admin_master") && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="rounded-xl text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground" activeClassName="bg-primary/12 text-primary font-medium shadow-sm ring-1 ring-primary/20">
                      <Crown className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Painel Master</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <div className="border-t border-border/70 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} className="rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
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
