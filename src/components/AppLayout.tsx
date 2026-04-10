import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/propostas": "Propostas",
  "/protocolos": "Protocolos",
  "/clientes": "Clientes",
  "/veiculos": "Veículos",
  "/agenda": "Agenda",
  "/financeiro": "Financeiro",
  "/estoque": "Estoque",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
  "/admin": "Painel Master",
};

const primaryMenuItems = [
  { title: "Veículos", url: "/veiculos" },
  { title: "Estoque", url: "/estoque" },
  { title: "Financeiro", url: "/financeiro" },
  { title: "Clientes", url: "/clientes" },
  { title: "Agenda", url: "/agenda" },
  { title: "Propostas", url: "/propostas" },
  { title: "Protocolos", url: "/protocolos" },
  { title: "Relatórios", url: "/relatorios" },
  { title: "Configurações", url: "/configuracoes" },
];

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { profile, roles } = useAuth();
  const location = useLocation();
  
  const { data: oficina } = useQuery({
    queryKey: ['oficina', profile?.oficina_id],
    queryFn: async () => {
      if (!profile?.oficina_id) return null;
      const { data, error } = await supabase
        .from('oficinas')
        .select('nome')
        .eq('id', profile.oficina_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.oficina_id,
  });

  const pageTitle = pageTitles[location.pathname] || "Gestao da oficina";
  const headerMenuItems = roles.includes("admin_master")
    ? [...primaryMenuItems, { title: "Painel Master", url: "/admin" }]
    : primaryMenuItems;
  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-transparent">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[linear-gradient(90deg,rgba(7,10,16,0.98)_0%,rgba(18,23,31,0.96)_52%,rgba(10,13,18,0.98)_100%)] px-4 py-3 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl md:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="shrink-0 border border-white/10 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 hover:text-white lg:hidden" />
                  <Link to="/" className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors hover:bg-white/[0.08]">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{todayLabel}</p>
                      <span className="block truncate text-base font-semibold text-slate-50">AutoLustre</span>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <div className="min-w-0 lg:text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{oficina?.nome || "Oficina"}</p>
                    <p className="truncate text-sm font-medium text-slate-200">{pageTitle}</p>
                  </div>
                  <Avatar className="h-9 w-9 border border-white/10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt="Perfil" />
                    <AvatarFallback className="bg-white/10 text-slate-300">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
                    {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-sky-300" />}
                  </Button>
                </div>
              </div>

              <nav aria-label="Menu principal" className="flex items-center gap-2 overflow-x-auto pb-1">
                {headerMenuItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    end={item.url === "/"}
                    className="whitespace-nowrap rounded-xl border border-transparent px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-sky-400/20 hover:bg-sky-400/10 hover:text-slate-50"
                    activeClassName="border-white/10 bg-white/[0.12] text-white shadow-[inset_0_-2px_0_0_rgba(96,165,250,0.95)]"
                  >
                    {item.title}
                  </NavLink>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1 overflow-auto px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
