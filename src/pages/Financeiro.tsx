import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, TrendingUp, TrendingDown } from "lucide-react";

const mockData = [
  { data: "15/03/2026", descricao: "Serviço de pintura - Civic", tipo: "entrada" as const, valor: 2500, categoria: "Serviços" },
  { data: "14/03/2026", descricao: "Compra de tinta", tipo: "saida" as const, valor: 800, categoria: "Material" },
  { data: "13/03/2026", descricao: "Polimento completo - Corolla", tipo: "entrada" as const, valor: 1200, categoria: "Serviços" },
];

const Financeiro = () => {
  const [search, setSearch] = useState("");
  const filtered = mockData.filter((f) => f.descricao.toLowerCase().includes(search.toLowerCase()));
  const totalEntradas = mockData.filter((f) => f.tipo === "entrada").reduce((a, b) => a + b.valor, 0);
  const totalSaidas = mockData.filter((f) => f.tipo === "saida").reduce((a, b) => a + b.valor, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Lançamento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-success" /><span className="text-sm text-muted-foreground">Entradas</span></div>
          <p className="text-2xl font-bold text-success">R$ {totalEntradas.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-sm text-muted-foreground">Saídas</span></div>
          <p className="text-2xl font-bold text-destructive">R$ {totalSaidas.toLocaleString("pt-BR")}</p>
        </div>
        <div className="glass-card p-5">
          <span className="text-sm text-muted-foreground">Saldo</span>
          <p className="text-2xl font-bold text-foreground">R$ {(totalEntradas - totalSaidas).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Data", "Descrição", "Tipo", "Valor", "Categoria"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.data}</td>
                <td className="p-4 text-sm">{item.descricao}</td>
                <td className="p-4 text-sm capitalize">{item.tipo === "entrada" ? <span className="text-success">Entrada</span> : <span className="text-destructive">Saída</span>}</td>
                <td className="p-4 text-sm font-mono">R$ {item.valor.toLocaleString("pt-BR")}</td>
                <td className="p-4 text-sm">{item.categoria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financeiro;
