import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";

interface ItemEstoque {
  id: string;
  oficina_id: string;
  nome: string;
  codigo: string | null;
  quantidade: number;
  quantidade_minima: number | null;
  valor_unitario: number | null;
}

const emptyForm = {
  nome: "",
  codigo: "",
  quantidade: "0",
  quantidade_minima: "0",
  valor_unitario: "0",
};

const Estoque = () => {
  const { profile } = useAuth();
  const [itens, setItens] = useState<ItemEstoque[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemEstoque | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("estoque").select("*").order("nome");
    if (data) setItens(data);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = itens.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (item?: ItemEstoque) => {
    if (item) {
      setEditing(item);
      setForm({
        nome: item.nome,
        codigo: item.codigo || "",
        quantidade: item.quantidade.toString(),
        quantidade_minima: (item.quantidade_minima || 0).toString(),
        valor_unitario: (item.valor_unitario || 0).toString(),
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      nome: form.nome.trim(),
      codigo: form.codigo || null,
      quantidade: parseFloat(form.quantidade) || 0,
      quantidade_minima: parseFloat(form.quantidade_minima) || 0,
      valor_unitario: parseFloat(form.valor_unitario) || 0,
    };

    const { error } = editing
      ? await supabase.from("estoque").update(payload).eq("id", editing.id)
      : await supabase.from("estoque").insert(payload);

    if (error) toast.error("Erro ao salvar item");
    else { toast.success(editing ? "Item atualizado" : "Item adicionado"); setDialogOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este item?")) return;
    const { error } = await supabase.from("estoque").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Item excluído"); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Adicionar Peça</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Nome", "Código", "Qtd", "Mín.", "Valor Unit.", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm flex items-center gap-2">
                  {Number(item.quantidade) < Number(item.quantidade_minima || 0) && <AlertTriangle className="h-4 w-4 text-warning" />}
                  {item.nome}
                </td>
                <td className="p-4 text-sm font-mono">{item.codigo || "—"}</td>
                <td className="p-4 text-sm">{item.quantidade}</td>
                <td className="p-4 text-sm">{item.quantidade_minima || 0}</td>
                <td className="p-4 text-sm font-mono">R$ {Number(item.valor_unitario || 0).toFixed(2)}</td>
                <td className="p-4 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} /></div>
              <div><Label>Qtd Mínima</Label><Input type="number" value={form.quantidade_minima} onChange={(e) => setForm({ ...form, quantidade_minima: e.target.value })} /></div>
              <div><Label>Valor Unit.</Label><Input type="number" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
