import { useNavigate } from "react-router-dom";
import {
  FileText, ClipboardList, Users, Car, Calendar,
  DollarSign, Package, BarChart3, Settings,
} from "lucide-react";

const cards = [
  { title: "Propostas", description: "Orçamentos e propostas", icon: FileText, url: "/propostas", color: "text-primary" },
  { title: "Protocolos", description: "Ordens de serviço", icon: ClipboardList, url: "/protocolos", color: "text-primary" },
  { title: "Clientes", description: "Base de clientes", icon: Users, url: "/clientes", color: "text-primary" },
  { title: "Veículos", description: "Cadastro de veículos", icon: Car, url: "/veiculos", color: "text-primary" },
  { title: "Agenda", description: "Agendamentos", icon: Calendar, url: "/agenda", color: "text-primary" },
  { title: "Financeiro", description: "Entradas e saídas", icon: DollarSign, url: "/financeiro", color: "text-success" },
  { title: "Estoque", description: "Peças e materiais", icon: Package, url: "/estoque", color: "text-warning" },
  { title: "Relatórios", description: "Análises e dados", icon: BarChart3, url: "/relatorios", color: "text-primary" },
  { title: "Configurações", description: "Serviços e valores", icon: Settings, url: "/configuracoes", color: "text-muted-foreground" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao GlossHub</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => navigate(card.url)}
            className="glass-card p-6 text-left hover:border-primary/50 transition-all group"
          >
            <card.icon className={`h-8 w-8 mb-3 ${card.color} group-hover:scale-110 transition-transform`} />
            <h3 className="font-semibold text-foreground">{card.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
