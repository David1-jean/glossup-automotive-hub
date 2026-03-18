import { BarChart3, FileText, ClipboardList, DollarSign, Wrench } from "lucide-react";

const reports = [
  { title: "Propostas por Período", description: "Relatório de propostas filtrado por data", icon: FileText },
  { title: "Protocolos por Período", description: "Ordens de serviço por período", icon: ClipboardList },
  { title: "Faturamento", description: "Resumo de faturamento da oficina", icon: DollarSign },
  { title: "Serviços Mais Realizados", description: "Ranking dos serviços mais populares", icon: Wrench },
];

const Relatorios = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r) => (
          <button key={r.title} className="glass-card p-6 text-left hover:border-primary/50 transition-all group">
            <r.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
