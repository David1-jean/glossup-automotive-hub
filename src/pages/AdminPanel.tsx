import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, CheckCircle, XCircle, DollarSign, Plus, Pencil, Eye, Trash2 } from "lucide-react";

interface Oficina {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  whatsapp: string | null;
  endereco: string | null;
  plano: string;
  status_assinatura: string;
  data_inicio: string | null;
  data_vencimento: string | null;
  ativa: boolean;
  telefone: string | null;
}

interface OficinFormData {
  nome: string;
  cnpj: string;
  email: string;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  plano: string;
  status_assinatura: string;
  data_inicio: string;
  data_vencimento: string;
  gerente_nome: string;
  gerente_email: string;
  gerente_senha: string;
}

const emptyForm: OficinFormData = {
  nome: "", cnpj: "", email: "", whatsapp: "",
  cep: "", rua: "", numero: "", bairro: "", cidade: "", uf: "",
  plano: "trial", status_assinatura: "trial",
  data_inicio: new Date().toISOString().split("T")[0],
  data_vencimento: "",
  gerente_nome: "", gerente_email: "", gerente_senha: "",
};

const OFICINA_PADRAO = "Oficina Admin";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    ativa: "bg-green-500/20 text-green-400 border-green-500/30",
    inativa: "bg-red-500/20 text-red-400 border-red-500/30",
    trial: "bg-primary/20 text-primary border-primary/30",
  };
  return map[status] || map.trial;
};

const AdminPanel = () => {
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [oficinaToDelete, setOficinaToDelete] = useState<Oficina | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OficinFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOficinas = async () => {
    const { data, error } = await supabase.from("oficinas").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar oficinas");
    } else {
      setOficinas((data || []) as Oficina[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOficinas(); }, []);

  const totalOficinas = oficinas.length;
  const ativas = oficinas.filter(o => o.status_assinatura === "ativa").length;
  const inativasTrial = oficinas.filter(o => o.status_assinatura !== "ativa").length;
  const receitaMensal = oficinas
    .filter(o => o.status_assinatura === "ativa")
    .reduce((sum, o) => {
      const valores: Record<string, number> = { basic: 199, pro: 499, trial: 0 };
      return sum + (valores[o.plano] || 0);
    }, 0);

  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({ ...f, rua: data.logradouro || "", bairro: data.bairro || "", cidade: data.localidade || "", uf: data.uf || "" }));
      }
    } catch { /* ignore */ }
  };

  const handleToggleAtiva = async (oficina: Oficina) => {
    const newStatus = oficina.status_assinatura === "ativa" ? "inativa" : "ativa";
    const { error } = await supabase
      .from("oficinas")
      .update({ status_assinatura: newStatus, ativa: newStatus === "ativa" })
      .eq("id", oficina.id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Oficina ${newStatus === "ativa" ? "ativada" : "desativada"}`);
      fetchOficinas();
    }
  };

  const handleDeleteClick = (oficina: Oficina) => {
    if (oficina.nome === OFICINA_PADRAO) {
      toast.error("A oficina padrão do sistema não pode ser excluída.");
      return;
    }
    setOficinaToDelete(oficina);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!oficinaToDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("oficinas").delete().eq("id", oficinaToDelete.id);
    if (error) {
      toast.error("Erro ao excluir oficina: " + error.message);
    } else {
      toast.success("Oficina excluída com sucesso");
      fetchOficinas();
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setOficinaToDelete(null);
  };

  const openEdit = (oficina: Oficina) => {
    const parts = (oficina.endereco || "").split(", ");
    setEditingId(oficina.id);
    setForm({
      nome: oficina.nome,
      cnpj: oficina.cnpj || "",
      email: oficina.email || "",
      whatsapp: oficina.whatsapp || "",
      cep: "", rua: parts[0] || "", numero: parts[1] || "",
      bairro: parts[2] || "", cidade: parts[3] || "", uf: parts[4] || "",
      plano: oficina.plano,
      status_assinatura: oficina.status_assinatura,
      data_inicio: oficina.data_inicio ? oficina.data_inicio.split("T")[0] : "",
      data_vencimento: oficina.data_vencimento ? oficina.data_vencimento.split("T")[0] : "",
      gerente_nome: "", gerente_email: "", gerente_senha: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);

    const endereco = [form.rua, form.numero, form.bairro, form.cidade, form.uf].filter(Boolean).join(", ");
    const payload = {
      nome: form.nome,
      cnpj: form.cnpj || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      endereco: endereco || null,
      plano: form.plano,
      status_assinatura: form.status_assinatura,
      data_inicio: form.data_inicio || null,
      data_vencimento: form.data_vencimento || null,
      ativa: form.status_assinatura === "ativa",
    };

    if (editingId) {
      const { error } = await supabase.from("oficinas").update(payload).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); setSaving(false); return; }
      toast.success("Oficina atualizada");
    } else {
      const { data: newOficina, error } = await supabase.from("oficinas").insert(payload).select().single();
      if (error) { toast.error("Erro ao criar oficina"); setSaving(false); return; }
      toast.success("Oficina criada");

      if (form.gerente_email && form.gerente_senha && newOficina) {
        const { data: session } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("create-user", {
          body: {
            email: form.gerente_email,
            password: form.gerente_senha,
            full_name: form.gerente_nome,
            oficina_id: newOficina.id,
            role: "gerente",
          },
        });
        if (res.error || res.data?.error) {
          toast.error("Oficina criada, mas erro ao criar gerente: " + (res.data?.error || res.error?.message));
        } else {
          toast.success("Gerente criado com sucesso");
        }
      }
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchOficinas();
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Admin Master</h1>
          <p className="text-muted-foreground">Gestão global de oficinas e assinaturas</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Oficina
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Oficinas</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-foreground">{totalOficinas}</p></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oficinas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{ativas}</p></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativas / Trial</CardTitle>
            <XCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">{inativasTrial}</p></CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">R$ {receitaMensal.toLocaleString("pt-BR")}</p></CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">E-mail</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Plano</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Início</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Vencimento</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">Carregando...</td></tr>
                ) : oficinas.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">Nenhuma oficina cadastrada</td></tr>
                ) : oficinas.map(o => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/5">
                    <td className="p-4 text-foreground font-medium">{o.nome}</td>
                    <td className="p-4 text-muted-foreground">{o.email || "—"}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="uppercase text-xs">{o.plano}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={statusBadge(o.status_assinatura)}>
                        {o.status_assinatura === "ativa" ? "Ativa" : o.status_assinatura === "inativa" ? "Inativa" : "Trial"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {o.data_inicio ? new Date(o.data_inicio).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {o.data_vencimento ? new Date(o.data_vencimento).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={o.status_assinatura === "ativa"}
                          onCheckedChange={() => handleToggleAtiva(o)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(o)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedOficina(o); setDetailDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(o)}
                          disabled={o.nome === OFICINA_PADRAO}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Oficina" : "Nova Oficina"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Oficina *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} onBlur={() => lookupCep(form.cep)} placeholder="00000-000" />
            </div>
            <div className="space-y-2">
              <Label>Rua</Label>
              <Input value={form.rua} onChange={e => setForm(f => ({ ...f, rua: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.bairro} onChange={e => setForm(f => ({ ...f, bairro: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={form.plano} onValueChange={v => setForm(f => ({ ...f, plano: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status_assinatura} onValueChange={v => setForm(f => ({ ...f, status_assinatura: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
            </div>

            {!editingId && (
              <>
                <div className="col-span-full">
                  <h3 className="text-sm font-medium text-primary mt-2">Criar Usuário Gerente</h3>
                </div>
                <div className="space-y-2">
                  <Label>Nome do Gerente</Label>
                  <Input value={form.gerente_nome} onChange={e => setForm(f => ({ ...f, gerente_nome: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Gerente</Label>
                  <Input type="email" value={form.gerente_email} onChange={e => setForm(f => ({ ...f, gerente_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Senha Inicial</Label>
                  <Input type="password" value={form.gerente_senha} onChange={e => setForm(f => ({ ...f, gerente_senha: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Oficina</DialogTitle>
          </DialogHeader>
          {selectedOficina && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nome:</span><span className="text-foreground font-medium">{selectedOficina.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CNPJ:</span><span>{selectedOficina.cnpj || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">E-mail:</span><span>{selectedOficina.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp:</span><span>{selectedOficina.whatsapp || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Endereço:</span><span>{selectedOficina.endereco || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plano:</span><Badge variant="outline" className="uppercase text-xs">{selectedOficina.plano}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge className={statusBadge(selectedOficina.status_assinatura)}>{selectedOficina.status_assinatura}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Início:</span><span>{selectedOficina.data_inicio ? new Date(selectedOficina.data_inicio).toLocaleDateString("pt-BR") : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vencimento:</span><span>{selectedOficina.data_vencimento ? new Date(selectedOficina.data_vencimento).toLocaleDateString("pt-BR") : "—"}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oficina</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a oficina <strong>{oficinaToDelete?.nome}</strong>? Todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;