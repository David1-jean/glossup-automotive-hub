import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Mail, Loader2 } from "lucide-react";

export function SubscriptionPaywall() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { back_url: window.location.origin + "/" },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erro ao criar assinatura");
        setLoading(false);
        return;
      }

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error("Link de pagamento não gerado");
        setLoading(false);
      }
    } catch {
      toast.error("Erro inesperado ao processar assinatura");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <span className="text-[#FF6B00] text-4xl font-bold">AutoLustre</span>
          <h1 className="text-2xl font-bold text-foreground mt-4">
            Seu período gratuito encerrou
          </h1>
          <p className="text-muted-foreground">
            Continue usando todas as funcionalidades do sistema com o plano Pro.
          </p>
        </div>

        <div className="glass-card p-6 space-y-4 neon-glow">
          <div className="text-center">
            <span className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Plano Pro</span>
            <div className="mt-2">
              <span className="text-4xl font-bold text-foreground">R$ 59,99</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>✓ Gestão completa de protocolos e propostas</li>
            <li>✓ Controle de clientes e veículos</li>
            <li>✓ Agenda e financeiro integrados</li>
            <li>✓ Relatórios e estoque</li>
            <li>✓ Suporte por WhatsApp</li>
          </ul>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-bold text-lg py-6"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar agora"
            )}
          </Button>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Precisa de ajuda?</p>
          <div className="flex flex-col items-center gap-2">
            <a
              href="https://wa.me/5524992241560"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              (24) 99224-1560
            </a>
            <a
              href="mailto:davidjeanreis.29@gmail.com"
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              davidjeanreis.29@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
