import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import workshopBg from "@/assets/workshop-bg.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check if user's oficina is active
    if (authData.user) {
      const { data: profile } = await supabase.from("profiles").select("oficina_id").eq("id", authData.user.id).single();
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id);
      const isAdmin = roles?.some(r => r.role === "admin_master");

      if (!isAdmin && profile?.oficina_id) {
        const { data: oficina } = await supabase.from("oficinas").select("status_assinatura, ativa, data_vencimento").eq("id", profile.oficina_id).single();
        if (oficina) {
          const expired = oficina.data_vencimento && new Date(oficina.data_vencimento) < new Date();
          if (!oficina.ativa || oficina.status_assinatura === "inativa" || expired) {
            await supabase.auth.signOut();
            toast.error("Sua assinatura está inativa. Entre em contato com o suporte.");
            setLoading(false);
            return;
          }
        }
      }
    }

    navigate("/");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu e-mail primeiro");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${workshopBg})` }}
      />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card p-8 neon-glow animate-fade-in">
          <div className="flex justify-center mb-8">
            <span className="text-[#FF6B00] text-3xl font-bold">AutoLustre</span>
          </div>

          <p className="text-center text-muted-foreground mb-8">
            Gestão inteligente para sua oficina
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <button
            onClick={handleForgotPassword}
            className="w-full mt-4 text-sm text-primary hover:underline text-center"
          >
            Esqueceu sua senha?
          </button>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
