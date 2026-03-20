import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";

interface Lancamento {
  id: string;
  oficina_id: string;
  tipo: string;
  descricao: string;
  valor: number;
  categoria: string | null;
  data: string;
}

const emptyForm = {
  tipo: "entrada",
  descricao: "",
  valor: "",
  categoria: "",
  data: new Date().toISOString().split("T")[0],
};

const Financeiro = () => {
  const { profile } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("financeiro").select("*").order("data", { ascending: false });
    if (data) setLancamentos(data);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = lancamentos.filter((f) => f.descricao.toLowerCase().includes(search.toLowerCase()));
  const totalEntradas = lancamentos.filter((f) => f.tipo === "entrada").reduce((a, b) => a + Number(b.valor), 0);
  const totalSaidas = lancamentos.filter((f) => f.tipo === "saida").reduce((a, b) => a + Number(b.valor), 0);

  const handleOpen = (lancamento?: Lancamento) => {
    if (lancamento) {
      setEditing(lancamento);
      setForm({
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: lancamento.valor.toString(),
        categoria: lancamento.categoria || "",
        data: lancamento.data,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor) || 0,
      categoria: form.categoria || null,
      data: form.data,
    };

    const { error } = editing
      ? await supabase.from("financeiro").update(payload).eq("id", editing.id)
      : await supabase.from("financeiro").insert(payload);

    if (error) toast.error("Erro ao salvar lançamento");
    else { toast.success(editing ? "Lançamento atualizado" : "Lançamento criado"); setDialogOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;
    const { error } = await supabase.from("financeiro").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Lançamento excluído"); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Novo Lançamento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-success" /><span className="text-sm text-muted-foreground">Entradas</span></div>
          <p className="text-2xl font-bold text-success">R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-sm text-muted-foreground">Saídas</span></div>
          <p className="text-2xl font-bold text-destructive">R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass-card p-5">
          <span className="text-sm text-muted-foreground">Saldo</span>
          <p className="text-2xl font-bold text-foreground">R$ {(totalEntradas - totalSaidas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
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
              {["Data", "Descrição", "Tipo", "Valor", "Categoria", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.data}</td>
                <td className="p-4 text-sm">{item.descricao}</td>
                <td className="p-4 text-sm">{item.tipo === "entrada" ? <span className="text-success">Entrada</span> : <span className="text-destructive">Saída</span>}</td>
                <td className="p-4 text-sm font-mono">R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td className="p-4 text-sm">{item.categoria || "—"}</td>
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
            <DialogTitle>{editing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição *</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
              <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            </div>
            <div><Label>Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Serviços, Material, Aluguel..." /></div>
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

export default Financeiro;
