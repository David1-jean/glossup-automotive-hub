import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Calendar as CalIcon } from "lucide-react";

interface Agendamento {
  id: string;
  oficina_id: string;
  cliente_id: string | null;
  veiculo_id: string | null;
  servico: string | null;
  data: string;
  hora: string | null;
  observacoes: string | null;
}

const emptyForm = {
  cliente_id: "",
  veiculo_id: "",
  servico: "",
  data: new Date().toISOString().split("T")[0],
  hora: "",
  observacoes: "",
};

const Agenda = () => {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [veiculos, setVeiculos] = useState<{ id: string; modelo: string | null; placa: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!profile?.oficina_id) return;
    const oid = profile.oficina_id;
    const [agRes, cliRes, veicRes] = await Promise.all([
      supabase.from("agendamentos").select("*").eq("oficina_id", oid).order("data", { ascending: true }),
      supabase.from("clientes").select("id, nome").eq("oficina_id", oid).order("nome"),
      supabase.from("veiculos").select("id, modelo, placa").eq("oficina_id", oid).order("modelo"),
    ]);
    if (agRes.data) setAgendamentos(agRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (veicRes.data) setVeiculos(veicRes.data);
  };

  useEffect(() => { fetchData(); }, [profile?.oficina_id]);

  const getClienteNome = (id: string | null) => clientes.find((c) => c.id === id)?.nome || "—";
  const getVeiculoLabel = (id: string | null) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.modelo || ""} ${v.placa || ""}`.trim() || "—" : "—";
  };

  const filtered = agendamentos.filter((a) =>
    getClienteNome(a.cliente_id).toLowerCase().includes(search.toLowerCase()) ||
    (a.servico || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (agendamento?: Agendamento) => {
    if (agendamento) {
      setEditing(agendamento);
      setForm({
        cliente_id: agendamento.cliente_id || "",
        veiculo_id: agendamento.veiculo_id || "",
        servico: agendamento.servico || "",
        data: agendamento.data,
        hora: agendamento.hora || "",
        observacoes: agendamento.observacoes || "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.data) { toast.error("Data é obrigatória"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      cliente_id: form.cliente_id || null,
      veiculo_id: form.veiculo_id || null,
      servico: form.servico || null,
      data: form.data,
      hora: form.hora || null,
      observacoes: form.observacoes || null,
    };

    const { error } = editing
      ? await supabase.from("agendamentos").update(payload).eq("id", editing.id)
      : await supabase.from("agendamentos").insert(payload);

    if (error) toast.error("Erro ao salvar agendamento");
    else { toast.success(editing ? "Agendamento atualizado" : "Agendamento criado"); setDialogOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este agendamento?")) return;
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Agendamento excluído"); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Novo Agendamento</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente ou serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1E293B] text-white">
            <tr className="border-b border-border">
              {["Data", "Hora", "Cliente", "Veículo", "Serviço", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.data}</td>
                <td className="p-4 text-sm">{item.hora || "—"}</td>
                <td className="p-4 text-sm">{getClienteNome(item.cliente_id)}</td>
                <td className="p-4 text-sm">{getVeiculoLabel(item.veiculo_id)}</td>
                <td className="p-4 text-sm">{item.servico || "—"}</td>
                <td className="p-4 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <CalIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Data *</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veículo</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.modelo} {v.placa}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Serviço</Label><Input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Ex: Polimento, Pintura..." /></div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
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

export default Agenda;
