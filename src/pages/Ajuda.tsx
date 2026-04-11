import { MessageCircle, Mail, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Ajuda = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ajuda e Suporte</h1>
        <p className="text-muted-foreground">Entre em contato conosco para tirar dúvidas ou solicitar suporte.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Canais de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">WhatsApp</h3>
            <p className="text-sm text-muted-foreground">
              Atendimento rápido pelo WhatsApp. Clique no botão abaixo para iniciar uma conversa.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <a href="https://wa.me/5524992241560" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                (24) 99224-1560
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">E-mail</h3>
            <p className="text-sm text-muted-foreground">
              Envie sua dúvida por e-mail e responderemos o mais breve possível.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <a href="mailto:davidjeanreis.29@gmail.com">
                <Mail className="h-4 w-4" />
                davidjeanreis.29@gmail.com
              </a>
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Horário de atendimento: Segunda a Sexta, das 8h às 18h.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ajuda;
