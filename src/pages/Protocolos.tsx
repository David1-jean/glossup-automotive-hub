import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface Protocolo {
  id: string;
  oficina_id: string;
  cliente_id: string | null;
  veiculo_id: string | null;
  status: string;
  status_assinatura: string;
  data_entrada: string | null;
  hora_entrada: string | null;
  km: string | null;
  previsao_entrega: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
}

const emptyForm = {
  cliente_id: "",
  veiculo_id: "",
  status: "aberta",
  status_assinatura: "não assinado",
  data_entrada: new Date().toISOString().split("T")[0],
  hora_entrada: "",
  km: "",
  previsao_entrega: "",
  forma_pagamento: "",
  observacoes: "",
};

const Protocolos = () => {
  const { profile } = useAuth();
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [veiculos, setVeiculos] = useState<{ id: string; modelo: string | null; placa: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Protocolo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [protRes, cliRes, veicRes] = await Promise.all([
      supabase.from("protocolos").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome").order("nome"),
      supabase.from("veiculos").select("id, modelo, placa").order("modelo"),
    ]);
    if (protRes.data) setProtocolos(protRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (veicRes.data) setVeiculos(veicRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const getClienteNome = (id: string | null) => clientes.find((c) => c.id === id)?.nome || "—";
  const getVeiculoLabel = (id: string | null) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.modelo || ""} ${v.placa || ""}`.trim() || "—" : "—";
  };

  const filtered = protocolos.filter((p) => {
    const matchSearch = getClienteNome(p.cliente_id).toLowerCase().includes(search.toLowerCase()) ||
      getVeiculoLabel(p.veiculo_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleOpen = (protocolo?: Protocolo) => {
    if (protocolo) {
      setEditing(protocolo);
      setForm({
        cliente_id: protocolo.cliente_id || "",
        veiculo_id: protocolo.veiculo_id || "",
        status: protocolo.status,
        status_assinatura: protocolo.status_assinatura,
        data_entrada: protocolo.data_entrada || "",
        hora_entrada: protocolo.hora_entrada || "",
        km: protocolo.km || "",
        previsao_entrega: protocolo.previsao_entrega || "",
        forma_pagamento: protocolo.forma_pagamento || "",
        observacoes: protocolo.observacoes || "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      cliente_id: form.cliente_id || null,
      veiculo_id: form.veiculo_id || null,
      status: form.status,
      status_assinatura: form.status_assinatura,
      data_entrada: form.data_entrada || null,
      hora_entrada: form.hora_entrada || null,
      km: form.km || null,
      previsao_entrega: form.previsao_entrega || null,
      forma_pagamento: form.forma_pagamento || null,
      observacoes: form.observacoes || null,
    };

    const { error } = editing
      ? await supabase.from("protocolos").update(payload).eq("id", editing.id)
      : await supabase.from("protocolos").insert(payload);

    if (error) toast.error("Erro ao salvar protocolo");
    else { toast.success(editing ? "Protocolo atualizado" : "Protocolo criado"); setDialogOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este protocolo?")) return;
    const { error } = await supabase.from("protocolos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Protocolo excluído"); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Protocolos de Serviço</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Novo Protocolo</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {["Todos", "Aberta", "Quitada", "Fechada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Cliente", "Veículo", "Data", "KM", "Status", "Assinatura", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{getClienteNome(item.cliente_id)}</td>
                <td className="p-4 text-sm">{getVeiculoLabel(item.veiculo_id)}</td>
                <td className="p-4 text-sm">{item.data_entrada || "—"}</td>
                <td className="p-4 text-sm font-mono">{item.km || "—"}</td>
                <td className="p-4"><StatusBadge status={item.status} /></td>
                <td className="p-4"><StatusBadge status={item.status_assinatura} /></td>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Protocolo" : "Novo Protocolo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Data Entrada</Label><Input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })} /></div>
              <div><Label>Hora Entrada</Label><Input type="time" value={form.hora_entrada} onChange={(e) => setForm({ ...form, hora_entrada: e.target.value })} /></div>
              <div><Label>KM</Label><Input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Previsão de Entrega</Label><Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} /></div>
              <div><Label>Forma de Pagamento</Label><Input value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} placeholder="Cartão, PIX, Dinheiro..." /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["aberta", "quitada", "fechada"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assinatura</Label>
                <Select value={form.status_assinatura} onValueChange={(v) => setForm({ ...form, status_assinatura: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="não assinado">Não Assinado</SelectItem>
                    <SelectItem value="assinado">Assinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

export default Protocolos;
