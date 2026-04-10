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

const statusOptions = [
  "Todos", "Pendente", "Enviado", "Aprovado", "Aprovado Parcial",
  "Reprovado", "Agendado", "Serviço Realizado", "Encerrado", "Repescado",
];

const statusValues = statusOptions.filter((s) => s !== "Todos").map((s) => s.toLowerCase());

interface Proposta {
  id: string;
  oficina_id: string;
  cliente_id: string | null;
  veiculo_id: string | null;
  consultor_id: string | null;
  status: string;
  observacoes: string | null;
  total: number | null;
  created_at: string;
}

interface ItemProposta {
  id?: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  horas: number;
  valor: number;
}

const emptyForm = {
  cliente_id: "",
  veiculo_id: "",
  status: "pendente",
  observacoes: "",
};

const emptyItem: ItemProposta = { tipo: "servico", descricao: "", quantidade: 1, horas: 0, valor: 0 };

const Propostas = () => {
  const { profile, user } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [veiculos, setVeiculos] = useState<{ id: string; modelo: string | null; placa: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proposta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [itens, setItens] = useState<ItemProposta[]>([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!profile?.oficina_id) return;
    const oid = profile.oficina_id;
    const [propRes, cliRes, veicRes] = await Promise.all([
      supabase.from("propostas").select("*").eq("oficina_id", oid).order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome").eq("oficina_id", oid).order("nome"),
      supabase.from("veiculos").select("id, modelo, placa").eq("oficina_id", oid).order("modelo"),
    ]);
    if (propRes.data) setPropostas(propRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (veicRes.data) setVeiculos(veicRes.data);
  };

  useEffect(() => { fetchData(); }, [profile?.oficina_id]);

  const getClienteNome = (id: string | null) => clientes.find((c) => c.id === id)?.nome || "—";
  const getVeiculoLabel = (id: string | null) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.modelo || ""} ${v.placa || ""}`.trim() || "—" : "—";
  };

  const filtered = propostas.filter((p) => {
    const matchSearch = getClienteNome(p.cliente_id).toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search);
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleOpen = async (proposta?: Proposta) => {
    if (proposta) {
      setEditing(proposta);
      setForm({
        cliente_id: proposta.cliente_id || "",
        veiculo_id: proposta.veiculo_id || "",
        status: proposta.status,
        observacoes: proposta.observacoes || "",
      });
      const { data } = await supabase.from("itens_proposta").select("*").eq("proposta_id", proposta.id);
      setItens(data && data.length > 0 ? data.map((i) => ({
        id: i.id,
        tipo: i.tipo,
        descricao: i.descricao,
        quantidade: Number(i.quantidade) || 1,
        horas: Number(i.horas) || 0,
        valor: Number(i.valor) || 0,
      })) : [{ ...emptyItem }]);
    } else {
      setEditing(null);
      setForm(emptyForm);
      setItens([{ ...emptyItem }]);
    }
    setDialogOpen(true);
  };

  const calcTotal = () => itens.reduce((sum, i) => sum + (i.valor * i.quantidade), 0);

  const handleSave = async () => {
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    if (!itens.some((i) => i.descricao.trim())) { toast.error("Adicione pelo menos um item"); return; }
    setLoading(true);

    const total = calcTotal();
    const payload = {
      oficina_id: profile.oficina_id,
      cliente_id: form.cliente_id || null,
      veiculo_id: form.veiculo_id || null,
      consultor_id: user?.id || null,
      status: form.status,
      observacoes: form.observacoes || null,
      total,
    };

    let propostaId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("propostas").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar proposta"); setLoading(false); return; }
      await supabase.from("itens_proposta").delete().eq("proposta_id", editing.id);
    } else {
      const { data, error } = await supabase.from("propostas").insert(payload).select("id").single();
      if (error || !data) { toast.error("Erro ao criar proposta"); setLoading(false); return; }
      propostaId = data.id;
    }

    const validItens = itens.filter((i) => i.descricao.trim());
    if (validItens.length > 0 && propostaId) {
      await supabase.from("itens_proposta").insert(
        validItens.map((i) => ({
          proposta_id: propostaId!,
          tipo: i.tipo,
          descricao: i.descricao.trim(),
          quantidade: i.quantidade,
          horas: i.horas,
          valor: i.valor,
        }))
      );
    }

    toast.success(editing ? "Proposta atualizada" : "Proposta criada");
    setDialogOpen(false);
    fetchData();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta proposta?")) return;
    await supabase.from("itens_proposta").delete().eq("proposta_id", id);
    const { error } = await supabase.from("propostas").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Proposta excluída"); fetchData(); }
  };

  const updateItem = (index: number, field: keyof ItemProposta, value: string | number) => {
    setItens((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Propostas</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Nova Proposta</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1E293B] text-white">
            <tr className="border-b border-border">
              {["Cliente", "Veículo", "Total", "Status", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{getClienteNome(item.cliente_id)}</td>
                <td className="p-4 text-sm">{getVeiculoLabel(item.veiculo_id)}</td>
                <td className="p-4 text-sm font-mono">R$ {(item.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td className="p-4"><StatusBadge status={item.status} /></td>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
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
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusValues.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Itens</Label>
                <Button variant="outline" size="sm" onClick={() => setItens([...itens, { ...emptyItem }])}>
                  <Plus className="h-3 w-3 mr-1" /> Item
                </Button>
              </div>
              {itens.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                  <div className="col-span-2">
                    <Select value={item.tipo} onValueChange={(v) => updateItem(idx, "tipo", v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="peca">Peça</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(idx, "descricao", e.target.value)} className="text-xs" />
                  </div>
                  <div className="col-span-1">
                     <Input type="number" placeholder="Qtd." value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", parseFloat(e.target.value) || 0)} className="text-xs" />
                   </div>
                   <div className="col-span-1">
                     <Input type="number" placeholder="Horas" value={item.horas} onChange={(e) => updateItem(idx, "horas", parseFloat(e.target.value) || 0)} className="text-xs" />
                   </div>
                   <div className="col-span-2">
                     <Input type="number" placeholder="Valor unitário" value={item.valor} onChange={(e) => updateItem(idx, "valor", parseFloat(e.target.value) || 0)} className="text-xs" />
                   </div>
                  <div className="col-span-2 flex gap-1">
                    <span className="text-xs font-mono self-center">R$ {(item.valor * item.quantidade).toFixed(2)}</span>
                    {itens.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setItens(itens.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-right font-bold mt-2">Total: R$ {calcTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
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

export default Propostas;
