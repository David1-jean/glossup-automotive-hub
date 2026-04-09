import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  
  const { data: oficina } = useQuery({
    queryKey: ['oficina', profile?.oficina_id],
    queryFn: async () => {
      if (!profile?.oficina_id) return null;
      const { data, error } = await supabase
        .from('oficinas')
        .select('nome_fantasia')
        .eq('id', profile.oficina_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.oficina_id,
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/80 backdrop-blur-sm">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-warning" />}
            </Button>
            <span className="text-sm font-medium text-foreground dark:text-white">
              {oficina?.nome_fantasia || "Oficina"}
            </span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
