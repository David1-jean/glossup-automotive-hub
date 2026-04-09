import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface ValorHora {
  id: string;
  oficina_id: string;
  ordem: number | null;
  categoria: string;
  valor: number;
}

interface Servico {
  id: string;
  oficina_id: string | null;
  nome: string;
}

const Configuracoes = () => {
  const { profile } = useAuth();
  const [valoresHora, setValoresHora] = useState<ValorHora[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [searchServico, setSearchServico] = useState("");

  // Valor Hora dialog
  const [vhDialogOpen, setVhDialogOpen] = useState(false);
  const [vhEditing, setVhEditing] = useState<ValorHora | null>(null);
  const [vhForm, setVhForm] = useState({ ordem: "", categoria: "", valor: "" });
  const [vhLoading, setVhLoading] = useState(false);

  // Servico dialog
  const [svcDialogOpen, setSvcDialogOpen] = useState(false);
  const [svcEditing, setSvcEditing] = useState<Servico | null>(null);
  const [svcForm, setSvcForm] = useState({ nome: "" });
  const [svcLoading, setSvcLoading] = useState(false);

  const fetchData = async () => {
    if (!profile?.oficina_id) return;

    const [vhRes, svcRes] = await Promise.all([
      supabase.from("valor_hora").select("*").eq("oficina_id", profile.oficina_id).order("ordem"),
      supabase.from("servicos").select("*").eq("oficina_id", profile.oficina_id).order("nome"),
    ]);
    if (vhRes.data) setValoresHora(vhRes.data);
    if (svcRes.data) setServicos(svcRes.data);
  };

  useEffect(() => { fetchData(); }, [profile?.oficina_id]);

  const filteredServicos = servicos.filter((s) => s.nome.toLowerCase().includes(searchServico.toLowerCase()));

  // Valor Hora CRUD
  const handleVhOpen = (item?: ValorHora) => {
    if (item) {
      setVhEditing(item);
      setVhForm({ ordem: (item.ordem || 0).toString(), categoria: item.categoria, valor: item.valor.toString() });
    } else {
      setVhEditing(null);
      setVhForm({ ordem: (valoresHora.length + 1).toString(), categoria: "", valor: "" });
    }
    setVhDialogOpen(true);
  };

  const handleVhSave = async () => {
    if (!vhForm.categoria.trim()) { toast.error("Categoria é obrigatória"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setVhLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      ordem: parseInt(vhForm.ordem) || 0,
      categoria: vhForm.categoria.trim(),
      valor: parseFloat(vhForm.valor) || 0,
    };

    const { error } = vhEditing
      ? await supabase.from("valor_hora").update(payload).eq("id", vhEditing.id)
      : await supabase.from("valor_hora").insert(payload);

    if (error) toast.error("Erro ao salvar");
    else { toast.success(vhEditing ? "Atualizado" : "Adicionado"); setVhDialogOpen(false); fetchData(); }
    setVhLoading(false);
  };

  const handleVhDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    const { error } = await supabase.from("valor_hora").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetchData(); }
  };

  // Servico CRUD
  const handleSvcOpen = (item?: Servico) => {
    if (item) { setSvcEditing(item); setSvcForm({ nome: item.nome }); }
    else { setSvcEditing(null); setSvcForm({ nome: "" }); }
    setSvcDialogOpen(true);
  };

  const handleSvcSave = async () => {
    if (!svcForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setSvcLoading(true);
    const payload = { oficina_id: profile.oficina_id, nome: svcForm.nome.trim() };

    const { error } = svcEditing
      ? await supabase.from("servicos").update(payload).eq("id", svcEditing.id)
      : await supabase.from("servicos").insert(payload);

    if (error) toast.error("Erro ao salvar");
    else { toast.success(svcEditing ? "Atualizado" : "Adicionado"); setSvcDialogOpen(false); fetchData(); }
    setSvcLoading(false);
  };

  const handleSvcDelete = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return;
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetchData(); }
  };

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
            <Button onClick={() => handleVhOpen()}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
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
                {valoresHora.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="p-4 text-sm">{item.ordem}</td>
                    <td className="p-4 text-sm">{item.categoria}</td>
                    <td className="p-4 text-sm font-mono">R$ {Number(item.valor).toFixed(2)}</td>
                    <td className="p-4 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleVhOpen(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleVhDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {valoresHora.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada</p>}
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar serviço..." value={searchServico} onChange={(e) => setSearchServico(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => handleSvcOpen()}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Nome", "Ações"].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServicos.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="p-4 text-sm">{item.nome}</td>
                    <td className="p-4 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleSvcOpen(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleSvcDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredServicos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum serviço cadastrado</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Valor Hora Dialog */}
      <Dialog open={vhDialogOpen} onOpenChange={setVhDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{vhEditing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Ordem</Label><Input type="number" value={vhForm.ordem} onChange={(e) => setVhForm({ ...vhForm, ordem: e.target.value })} /></div>
            <div><Label>Categoria *</Label><Input value={vhForm.categoria} onChange={(e) => setVhForm({ ...vhForm, categoria: e.target.value })} placeholder="Ex: Veículos Nacionais" /></div>
            <div><Label>Valor/Hora (R$)</Label><Input type="number" value={vhForm.valor} onChange={(e) => setVhForm({ ...vhForm, valor: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setVhDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleVhSave} disabled={vhLoading}>{vhLoading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Servico Dialog */}
      <Dialog open={svcDialogOpen} onOpenChange={setSvcDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{svcEditing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Nome *</Label><Input value={svcForm.nome} onChange={(e) => setSvcForm({ ...svcForm, nome: e.target.value })} placeholder="Ex: Pintura completa" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSvcDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSvcSave} disabled={svcLoading}>{svcLoading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
