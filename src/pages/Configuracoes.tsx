import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const mockValorHora = [
  { ordem: 1, categoria: "Veículos Nacionais", valor: 80 },
  { ordem: 2, categoria: "Importados", valor: 120 },
  { ordem: 3, categoria: "Premium", valor: 180 },
  { ordem: 4, categoria: "Segurado", valor: 100 },
];

const mockServicos = [
  { nome: "Pintura completa", descricao: "Pintura total do veículo" },
  { nome: "Polimento técnico", descricao: "Polimento com correção de pintura" },
  { nome: "Funilaria", descricao: "Reparo de amassados e deformações" },
];

const Configuracoes = () => {
  const [searchServico, setSearchServico] = useState("");
  const filteredServicos = mockServicos.filter((s) => s.nome.toLowerCase().includes(searchServico.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Tabs defaultValue="valor-hora">
        <TabsList className="bg-secondary">
          <TabsTrigger value="valor-hora">Valor x Hora</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="valor-hora" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Ordem", "Categoria", "Valor/Hora", "Ações"].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockValorHora.map((item) => (
                  <tr key={item.ordem} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="p-4 text-sm">{item.ordem}</td>
                    <td className="p-4 text-sm">{item.categoria}</td>
                    <td className="p-4 text-sm font-mono">R$ {item.valor.toFixed(2)}</td>
                    <td className="p-4 flex gap-1">
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar serviço..." value={searchServico} onChange={(e) => setSearchServico(e.target.value)} className="pl-9" />
            </div>
            <Button><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Nome", "Descrição", "Ações"].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServicos.map((item) => (
                  <tr key={item.nome} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="p-4 text-sm">{item.nome}</td>
                    <td className="p-4 text-sm text-muted-foreground">{item.descricao}</td>
                    <td className="p-4 flex gap-1">
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
