import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil } from "lucide-react";

const mockData = [
  { nome: "João Silva", celular: "(11) 99999-0001" },
  { nome: "Maria Santos", celular: "(11) 99999-0002" },
  { nome: "Pedro Souza", celular: "(11) 99999-0003" },
];

const Clientes = () => {
  const [search, setSearch] = useState("");
  const filtered = mockData.filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Nome</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Celular</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.nome} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.nome}</td>
                <td className="p-4 text-sm">{item.celular}</td>
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

export default Clientes;
