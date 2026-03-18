import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Pencil } from "lucide-react";

const mockData = [
  { cod: "OS001", cliente: "João Silva", veiculo: "Civic", placa: "ABC-1234", status: "Aberta", assinatura: "Assinado" },
  { cod: "OS002", cliente: "Maria Santos", veiculo: "Corolla", placa: "DEF-5678", status: "Quitada", assinatura: "Não Assinado" },
];

const Protocolos = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered = mockData.filter((item) => {
    const matchSearch = Object.values(item).some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "Todos" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Protocolos de Serviço</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Protocolo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {["Todos", "Aberta", "Quitada", "Fechada"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Cód", "Cliente", "Veículo", "Placa", "Status", "Assinatura", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.cod} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm font-mono">{item.cod}</td>
                <td className="p-4 text-sm">{item.cliente}</td>
                <td className="p-4 text-sm">{item.veiculo}</td>
                <td className="p-4 text-sm font-mono">{item.placa}</td>
                <td className="p-4"><StatusBadge status={item.status} /></td>
                <td className="p-4"><StatusBadge status={item.assinatura} /></td>
                <td className="p-4"><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado</p>}
      </div>
    </div>
  );
};

export default Protocolos;
