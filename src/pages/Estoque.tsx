import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, AlertTriangle } from "lucide-react";

const mockData = [
  { nome: "Tinta PU Branca", codigo: "TIN001", quantidade: 5, minimo: 3, valor: 189.9 },
  { nome: "Lixa 600", codigo: "LIX001", quantidade: 2, minimo: 10, valor: 4.5 },
  { nome: "Massa Poliéster", codigo: "MAS001", quantidade: 12, minimo: 5, valor: 45.0 },
];

const Estoque = () => {
  const [search, setSearch] = useState("");
  const filtered = mockData.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Adicionar Peça</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Nome", "Código", "Qtd", "Valor Unit.", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.codigo} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm flex items-center gap-2">
                  {item.quantidade < item.minimo && <AlertTriangle className="h-4 w-4 text-warning" />}
                  {item.nome}
                </td>
                <td className="p-4 text-sm font-mono">{item.codigo}</td>
                <td className="p-4 text-sm">{item.quantidade}</td>
                <td className="p-4 text-sm font-mono">R$ {item.valor.toFixed(2)}</td>
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

export default Estoque;
