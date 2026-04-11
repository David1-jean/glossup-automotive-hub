import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin_master" | "gerente" | "consultor";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, loading, hasRole, profile, isAdminMaster } = useAuth();

  const { data: oficina, isLoading: oficinaLoading } = useQuery({
    queryKey: ['oficina-status', profile?.oficina_id],
    queryFn: async () => {
      if (!profile?.oficina_id) return null;
      const { data } = await supabase
        .from('oficinas')
        .select('status_assinatura, ativa, data_vencimento')
        .eq('id', profile.oficina_id)
        .single();
      return data;
    },
    enabled: !!profile?.oficina_id && !isAdminMaster,
  });

  if (loading || (!!profile?.oficina_id && !isAdminMaster && oficinaLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check subscription status (skip for admin_master)
  if (!isAdminMaster && oficina) {
    const expired = oficina.data_vencimento && new Date(oficina.data_vencimento) < new Date();
    const blocked = !oficina.ativa || oficina.status_assinatura === "inativa" || expired;
    if (blocked) {
      return <SubscriptionPaywall />;
    }
  }

  if (requiredRole && !hasRole(requiredRole) && !isAdminMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
