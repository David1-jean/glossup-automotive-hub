import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface Veiculo {
  id: string;
  oficina_id: string;
  cliente_id: string | null;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  cor: string | null;
  combustivel: string | null;
  chassi: string | null;
  motor: string | null;
  observacoes: string | null;
}

interface ClienteOption {
  id: string;
  nome: string;
}

const emptyForm = {
  cliente_id: "",
  placa: "",
  marca: "",
  modelo: "",
  ano_fabricacao: "",
  ano_modelo: "",
  cor: "",
  combustivel: "",
  chassi: "",
  motor: "",
  observacoes: "",
};

const Veiculos = () => {
  const { profile } = useAuth();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Veiculo | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const plateDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-lookup by plate
  useEffect(() => {
    const clean = form.placa.replace(/[^A-Z0-9]/g, "");
    if (clean.length !== 7) return;
    if (plateDebounce.current) clearTimeout(plateDebounce.current);
    plateDebounce.current = setTimeout(() => {
      fetch(`https://brasilapi.com.br/api/vehicles/v1/${clean}`)
        .then(r => r.json())
        .then(data => {
          if (data && !data.message) {
            setForm(f => ({
              ...f,
              marca: data.marca || f.marca,
              modelo: data.modelo || f.modelo,
              ano_fabricacao: data.ano ? data.ano.toString() : f.ano_fabricacao,
              ano_modelo: data.anoModelo ? data.anoModelo.toString() : f.ano_modelo,
            }));
            toast.success("Dados do veículo preenchidos automaticamente");
          }
        })
        .catch(() => {});
    }, 300);
    return () => { if (plateDebounce.current) clearTimeout(plateDebounce.current); };
  }, [form.placa]);

  const fetchData = async () => {
    const [veicRes, cliRes] = await Promise.all([
      supabase.from("veiculos").select("*").order("modelo"),
      supabase.from("clientes").select("id, nome").order("nome"),
    ]);
    if (veicRes.data) setVeiculos(veicRes.data);
    if (cliRes.data) setClientes(cliRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = veiculos.filter((v) =>
    (v.modelo || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.placa || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.marca || "").toLowerCase().includes(search.toLowerCase())
  );

  const getClienteNome = (id: string | null) => clientes.find((c) => c.id === id)?.nome || "—";

  const handleOpen = (veiculo?: Veiculo) => {
    if (veiculo) {
      setEditing(veiculo);
      setForm({
        cliente_id: veiculo.cliente_id || "",
        placa: veiculo.placa || "",
        marca: veiculo.marca || "",
        modelo: veiculo.modelo || "",
        ano_fabricacao: veiculo.ano_fabricacao?.toString() || "",
        ano_modelo: veiculo.ano_modelo?.toString() || "",
        cor: veiculo.cor || "",
        combustivel: veiculo.combustivel || "",
        chassi: veiculo.chassi || "",
        motor: veiculo.motor || "",
        observacoes: veiculo.observacoes || "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.modelo.trim()) { toast.error("Modelo é obrigatório"); return; }
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);

    const payload = {
      oficina_id: profile.oficina_id,
      cliente_id: form.cliente_id || null,
      placa: form.placa || null,
      marca: form.marca || null,
      modelo: form.modelo.trim(),
      ano_fabricacao: form.ano_fabricacao ? parseInt(form.ano_fabricacao) : null,
      ano_modelo: form.ano_modelo ? parseInt(form.ano_modelo) : null,
      cor: form.cor || null,
      combustivel: form.combustivel || null,
      chassi: form.chassi || null,
      motor: form.motor || null,
      observacoes: form.observacoes || null,
    };

    const { error } = editing
      ? await supabase.from("veiculos").update(payload).eq("id", editing.id)
      : await supabase.from("veiculos").insert(payload);

    if (error) { toast.error("Erro ao salvar veículo"); }
    else { toast.success(editing ? "Veículo atualizado" : "Veículo adicionado"); setDialogOpen(false); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este veículo?")) return;
    const { error } = await supabase.from("veiculos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir veículo");
    else { toast.success("Veículo excluído"); fetchData(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Veículos</h1>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por modelo, marca ou placa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Marca", "Modelo", "Placa", "Cor", "Cliente", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.marca || "—"}</td>
                <td className="p-4 text-sm">{item.modelo || "—"}</td>
                <td className="p-4 text-sm font-mono">{item.placa || "—"}</td>
                <td className="p-4 text-sm">{item.cor || "—"}</td>
                <td className="p-4 text-sm">{getClienteNome(item.cliente_id)}</td>
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
            <DialogTitle>{editing ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
              <div><Label>Modelo *</Label><Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Placa</Label><Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} placeholder="ABC1D23" /></div>
              <div><Label>Ano Fabricação</Label><Input type="number" value={form.ano_fabricacao} onChange={(e) => setForm({ ...form, ano_fabricacao: e.target.value })} /></div>
              <div><Label>Ano Modelo</Label><Input type="number" value={form.ano_modelo} onChange={(e) => setForm({ ...form, ano_modelo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Cor</Label><Input value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
              <div><Label>Combustível</Label><Input value={form.combustivel} onChange={(e) => setForm({ ...form, combustivel: e.target.value })} placeholder="Flex, Diesel..." /></div>
              <div><Label>Motor</Label><Input value={form.motor} onChange={(e) => setForm({ ...form, motor: e.target.value })} /></div>
            </div>
            <div><Label>Chassi</Label><Input value={form.chassi} onChange={(e) => setForm({ ...form, chassi: e.target.value })} /></div>
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

export default Veiculos;
