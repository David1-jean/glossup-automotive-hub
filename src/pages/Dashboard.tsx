import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  ClipboardList,
  Users,
  Car,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";

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

const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

      const statusMap: Record<string, number> = {};
      (pRes.data || []).forEach((p) => {
        const status = p.status || "pendente";
        statusMap[status] = (statusMap[status] || 0) + 1;
      });
      setStatusData(
        Object.entries(statusMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: STATUS_COLORS[name] || "hsl(0 0% 50%)",
        })),
      );

      const year = new Date().getFullYear();
      const monthMap: Record<number, { entradas: number; saidas: number }> = {};
      for (let index = 0; index < 12; index += 1) {
        monthMap[index] = { entradas: 0, saidas: 0 };
      }

      let totalIn = 0;
      let totalOut = 0;
      (fRes.data || []).forEach((item) => {
        const date = new Date(item.data);
        if (date.getFullYear() !== year) return;

        const month = date.getMonth();
        const value = Number(item.valor) || 0;
        if (item.tipo === "entrada") {
          monthMap[month].entradas += value;
          totalIn += value;
          return;
        }

        monthMap[month].saidas += value;
        totalOut += value;
      });

      setFinData(Object.entries(monthMap).map(([month, values]) => ({ month: MONTHS[+month], ...values })));
      setTotals({ entradas: totalIn, saidas: totalOut });
    };

    load();
  }, [profile?.oficina_id]);

  const metricCards = [
    { label: "Clientes ativos", value: metrics.clientes, icon: Users, helper: "Base cadastrada" },
    { label: "Veículos", value: metrics.veiculos, icon: Car, helper: "Frota vinculada" },
    { label: "Propostas", value: metrics.propostas, icon: FileText, helper: "Funil comercial" },
    { label: "Ordens de serviço", value: metrics.protocolos, icon: ClipboardList, helper: "Histórico operacional" },
  ];

  const saldo = totals.entradas - totals.saidas;
  const aprovadas = statusData.find((item) => item.name.toLowerCase() === "aprovado")?.value ?? 0;
  const pendentes = statusData.find((item) => item.name.toLowerCase() === "pendente")?.value ?? 0;
  const totalPropostas = statusData.reduce((acc, item) => acc + item.value, 0);
  const approvalRate = totalPropostas > 0 ? Math.round((aprovadas / totalPropostas) * 100) : 0;
  const latestMonth = [...finData].reverse().find((item) => item.entradas > 0 || item.saidas > 0);
  const latestMonthLabel = latestMonth?.month || "Ano atual";

  return (
    <div className="page-shell animate-fade-in">
      <section className="glass-card overflow-hidden border-border/70">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr] lg:p-8">
          <div className="space-y-5">
            <div>
              <p className="section-heading">Visão geral</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Operação da oficina em tempo real</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Acompanhe ordens, funil comercial e resultado financeiro em uma visão única, com foco em decisão rápida e leitura clara.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="panel-muted p-4">
                <p className="section-heading">Saldo atual</p>
                <p className={`data-highlight mt-2 text-2xl font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(saldo)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Entradas menos saidas no ano.</p>
              </div>
              <div className="panel-muted p-4">
                <p className="section-heading">Conversao</p>
                <p className="mt-2 text-2xl font-bold">{approvalRate}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Propostas aprovadas no funil.</p>
              </div>
              <div className="panel-muted p-4">
                <p className="section-heading">Mes monitorado</p>
                <p className="mt-2 text-2xl font-bold">{latestMonthLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">Ultimo periodo com movimentacao.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/protocolos")} className="h-11 rounded-xl px-5">
                Abrir ordens de serviço
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/financeiro")} className="h-11 rounded-xl px-5">
                Ver financeiro
              </Button>
            </div>
          </div>

          <div className="panel-muted flex flex-col justify-between p-5">
            <div>
              <p className="section-heading">Resumo executivo</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-background/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-success/10 p-2 text-success">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Entradas</p>
                      <p className="text-xs text-muted-foreground">Receita acumulada</p>
                    </div>
                  </div>
                  <p className="data-highlight text-sm font-semibold text-success">{formatCurrency(totals.entradas)}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-background/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-destructive/10 p-2 text-destructive">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Saidas</p>
                      <p className="text-xs text-muted-foreground">Custos e despesas</p>
                    </div>
                  </div>
                  <p className="data-highlight text-sm font-semibold text-destructive">{formatCurrency(totals.saidas)}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-background/80 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Pendencias</p>
                      <p className="text-xs text-muted-foreground">Propostas aguardando retorno</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{pendentes}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Performance comercial
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {aprovadas} aprovadas de {totalPropostas} propostas registradas no periodo analisado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => (
          <Card key={item.label} className="glass-card border-border/70">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/10">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-card border-border/70">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-2xl bg-success/10 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-success/15 p-2 text-success">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas (ano)</p>
                  <p className="data-highlight text-xl font-bold text-success">{formatCurrency(totals.entradas)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-destructive/10 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-destructive/15 p-2 text-destructive">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saidas (ano)</p>
                  <p className="data-highlight text-xl font-bold text-destructive">{formatCurrency(totals.saidas)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-2 text-primary">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p className={`data-highlight text-xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(saldo)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Funil de propostas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusData.length > 0 ? (
              statusData.map((item) => {
                const percentage = totalPropostas > 0 ? Math.round((item.value / totalPropostas) * 100) : 0;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.fill }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma proposta encontrada</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Propostas por status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma proposta encontrada</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Faturamento mensal</CardTitle>
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
      </section>

      <section>
        <div className="mb-4">
          <p className="section-heading">Atalhos</p>
          <h2 className="mt-1 text-lg font-semibold">Acesso rapido aos modulos</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {navCards.map((card) => (
            <button
              key={card.title}
              onClick={() => navigate(card.url)}
              className="glass-card group border-border/70 p-6 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/10 transition-transform group-hover:scale-105">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
