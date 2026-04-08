import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, ClipboardList, Users, Car, Calendar,
  DollarSign, Package, BarChart3, Settings, TrendingUp, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const navCards = [
  { title: "Propostas", description: "Orçamentos e propostas", icon: FileText, url: "/propostas" },
  { title: "Protocolos", description: "Ordens de serviço", icon: ClipboardList, url: "/protocolos" },
  { title: "Clientes", description: "Base de clientes", icon: Users, url: "/clientes" },
  { title: "Veículos", description: "Cadastro de veículos", icon: Car, url: "/veiculos" },
  { title: "Agenda", description: "Agendamentos", icon: Calendar, url: "/agenda" },
  { title: "Financeiro", description: "Entradas e saídas", icon: DollarSign, url: "/financeiro" },
  { title: "Estoque", description: "Peças e materiais", icon: Package, url: "/estoque" },
  { title: "Relatórios", description: "Análises e dados", icon: BarChart3, url: "/relatorios" },
  { title: "Configurações", description: "Serviços e valores", icon: Settings, url: "/configuracoes" },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: "hsl(25 100% 50%)",
  aprovado: "hsl(142 71% 45%)",
  reprovado: "hsl(0 84% 60%)",
  enviado: "hsl(0 0% 60%)",
  "aprovado parcial": "hsl(38 92% 50%)",
  agendado: "hsl(200 80% 50%)",
  encerrado: "hsl(0 0% 40%)",
};

const pieConfig = {
  pendente: { label: "Pendente", color: "hsl(25 100% 50%)" },
  aprovado: { label: "Aprovado", color: "hsl(142 71% 45%)" },
  reprovado: { label: "Reprovado", color: "hsl(0 84% 60%)" },
  enviado: { label: "Enviado", color: "hsl(0 0% 60%)" },
  outros: { label: "Outros", color: "hsl(200 80% 50%)" },
};

const barConfig = {
  entradas: { label: "Entradas", color: "hsl(142 71% 45%)" },
  saidas: { label: "Saídas", color: "hsl(0 84% 60%)" },
};

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState({ clientes: 0, veiculos: 0, propostas: 0, protocolos: 0 });
  const [statusData, setStatusData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [finData, setFinData] = useState<{ month: string; entradas: number; saidas: number }[]>([]);
  const [totals, setTotals] = useState({ entradas: 0, saidas: 0 });

  useEffect(() => {
    if (!profile?.oficina_id) return;
    const oid = profile.oficina_id;

    const load = async () => {
      const [cRes, vRes, pRes, prRes, fRes] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("oficina_id", oid),
        supabase.from("veiculos").select("id", { count: "exact", head: true }).eq("oficina_id", oid),
        supabase.from("propostas").select("id, status").eq("oficina_id", oid),
        supabase.from("protocolos").select("id", { count: "exact", head: true }).eq("oficina_id", oid),
        supabase.from("financeiro").select("tipo, valor, data").eq("oficina_id", oid),
      ]);

      setMetrics({
        clientes: cRes.count ?? 0,
        veiculos: vRes.count ?? 0,
        propostas: pRes.data?.length ?? 0,
        protocolos: prRes.count ?? 0,
      });

      // Propostas by status
      const statusMap: Record<string, number> = {};
      (pRes.data || []).forEach((p) => {
        const s = p.status || "pendente";
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      setStatusData(
        Object.entries(statusMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: STATUS_COLORS[name] || "hsl(0 0% 50%)",
        }))
      );

      // Financial by month
      const year = new Date().getFullYear();
      const monthMap: Record<number, { entradas: number; saidas: number }> = {};
      for (let i = 0; i < 12; i++) monthMap[i] = { entradas: 0, saidas: 0 };
      let totalIn = 0, totalOut = 0;
      (fRes.data || []).forEach((f) => {
        const d = new Date(f.data);
        if (d.getFullYear() === year) {
          const m = d.getMonth();
          const v = Number(f.valor) || 0;
          if (f.tipo === "entrada") { monthMap[m].entradas += v; totalIn += v; }
          else { monthMap[m].saidas += v; totalOut += v; }
        }
      });
      setFinData(Object.entries(monthMap).map(([m, v]) => ({ month: MONTHS[+m], ...v })));
      setTotals({ entradas: totalIn, saidas: totalOut });
    };

    load();
  }, [profile?.oficina_id]);

  const metricCards = [
    { label: "Clientes", value: metrics.clientes, icon: Users },
    { label: "Veículos", value: metrics.veiculos, icon: Car },
    { label: "Propostas", value: metrics.propostas, icon: FileText },
    { label: "Protocolos", value: metrics.protocolos, icon: ClipboardList },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo à Oficina</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label} className="glass-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <m.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas (ano)</p>
              <p className="text-xl font-bold text-success">
                R$ {totals.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas (ano)</p>
              <p className="text-xl font-bold text-destructive">
                R$ {totals.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Propostas por Status */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Propostas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Nenhuma proposta encontrada</p>
            )}
          </CardContent>
        </Card>

        {/* Faturamento Mensal */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barConfig} className="h-[250px] w-full">
              <BarChart data={finData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="entradas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Navigation cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.url)}
              className="glass-card p-6 text-left group"
            >
              <card.icon className="h-8 w-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
