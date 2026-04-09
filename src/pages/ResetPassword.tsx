import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import workshopBg from "@/assets/workshop-bg.jpg";
import autolustreLogo from "@/assets/autolustre-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Link de recuperação inválido");
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${workshopBg})` }} />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card p-8 neon-glow animate-fade-in">
          <div className="flex justify-center mb-8">
            <img src={autolustreLogo} alt="AutoLustre" className="h-16 object-contain" />
          </div>
          <p className="text-center text-muted-foreground mb-8">Defina sua nova senha</p>
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
