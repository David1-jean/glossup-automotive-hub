import {
  LayoutDashboard, LogOut, Crown, User,
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

const sidebarItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
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
{!collapsed && profile && (
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Foto de perfil"
                  className="h-9 w-9 rounded-full object-cover border border-sidebar-border"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
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
          <SidebarGroupLabel>Navegação Rápida</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
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
