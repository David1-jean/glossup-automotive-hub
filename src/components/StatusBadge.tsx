import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pendente: "status-pendente",
  enviado: "status-enviado",
  aprovado: "status-aprovado",
  "aprovado parcial": "status-aprovado",
  reprovado: "status-reprovado",
  agendado: "bg-primary/20 text-primary",
  "serviço realizado": "bg-success/20 text-success",
  encerrado: "bg-muted text-muted-foreground",
  repescado: "bg-warning/20 text-warning",
  aberta: "bg-primary/20 text-primary",
  quitada: "bg-success/20 text-success",
  fechada: "bg-muted text-muted-foreground",
  assinado: "bg-success/20 text-success",
  "não assinado": "bg-primary/20 text-primary",
  ativa: "bg-success/20 text-success",
  inativa: "bg-destructive/20 text-destructive",
  trial: "bg-warning/20 text-warning",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", statusStyles[key] || "bg-muted text-muted-foreground", className)}>
      {status}
    </span>
  );
}
