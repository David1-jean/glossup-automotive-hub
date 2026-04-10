import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Archive } from "lucide-react";

interface Cliente {
  id: string;
  oficina_id: string;
  nome: string;
  whatsapp: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  origem: string | null;
  tipo_pessoa: string | null;
  cpf: string | null;
  cnpj: string | null;
  rg: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  observacoes: string | null;
  excluido_em: string | null;
}

const emptyForm = {
  nome: "",
  whatsapp: "",
  telefone: "",
  email: "",
  data_nascimento: "",
  origem: "",
  tipo_pessoa: "fisica",
  cpf: "",
  cnpj: "",
  rg: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
  observacoes: "",
};

const Clientes = () => {
  const { profile } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesLixeira, setClientesLixeira] = useState<Cliente[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+55");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .is("excluido_em", null)
      .order("nome");
    if (error) {
      toast.error("Erro ao carregar clientes");
      return;
    }
    setClientes(data as Cliente[]);
  };

  const fetchClientesLixeira = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .not("excluido_em", "is", null)
      .order("excluido_em", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar lixeira");
      return;
    }
    setClientesLixeira(data as Cliente[]);
  };

  useEffect(() => {
    fetchClientes();
    fetchClientesLixeira();
  }, []);

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTrash = clientesLixeira.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = (cliente?: Cliente) => {
    if (cliente) {
      setEditing(cliente);
      setForm({
        nome: cliente.nome || "",
        whatsapp: cliente.whatsapp || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        data_nascimento: cliente.data_nascimento || "",
        origem: cliente.origem || "",
        tipo_pessoa: cliente.tipo_pessoa || "fisica",
        cpf: cliente.cpf || "",
        cnpj: cliente.cnpj || "",
        rg: cliente.rg || "",
        cep: cliente.cep || "",
        rua: cliente.rua || "",
        numero: cliente.numero || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        observacoes: cliente.observacoes || "",
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCepSearch = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!profile?.oficina_id) {
      toast.error("Oficina não identificada");
      return;
    }
    setLoading(true);

    const payload = {
      oficina_id: profile.oficina_id,
      nome: form.nome.trim(),
      whatsapp: form.whatsapp ? `${countryCode}${form.whatsapp.replace(/\D/g, "")}` : null,
      telefone: form.telefone || null,
      email: form.email || null,
      data_nascimento: form.data_nascimento || null,
      origem: form.origem || null,
      tipo_pessoa: form.tipo_pessoa,
      cpf: form.cpf || null,
      cnpj: form.cnpj || null,
      rg: form.rg || null,
      cep: form.cep || null,
      rua: form.rua || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      observacoes: form.observacoes || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error("Erro ao atualizar cliente");
      } else {
        toast.success("Cliente atualizado");
        setDialogOpen(false);
        fetchClientes();
      }
    } else {
      const { error } = await supabase.from("clientes").insert(payload);
      if (error) {
        toast.error("Erro ao criar cliente");
      } else {
        toast.success("Cliente adicionado");
        setDialogOpen(false);
        fetchClientes();
      }
    }
    setLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("clientes")
      .update({ excluido_em: new Date().toISOString() })
      .eq("id", deleteId);
    if (error) {
      toast.error("Erro ao excluir cliente");
    } else {
      toast.success("Cliente movido para lixeira");
      fetchClientes();
      fetchClientesLixeira();
    }
    setDeleteId(null);
  };

  const restoreCliente = async (id: string) => {
    const { error } = await supabase
      .from("clientes")
      .update({ excluido_em: null })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao restaurar cliente");
    } else {
      toast.success("Cliente restaurado");
      fetchClientes();
      fetchClientesLixeira();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{showTrash ? "Lixeira" : "Clientes"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTrash(!showTrash)}>
            <Archive className="h-4 w-4 mr-2" /> {showTrash ? "Clientes" : "Lixeira"} ({clientesLixeira.length})
          </Button>
          {!showTrash && (
            <Button onClick={() => handleOpen()}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1E293B] text-white">
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-semibold uppercase">Nome</th>
              <th className="text-left p-4 text-xs font-semibold uppercase">Celular</th>
              <th className="text-left p-4 text-xs font-semibold uppercase">E-mail</th>
              <th className="text-left p-4 text-xs font-semibold uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm">{item.nome}</td>
                <td className="p-4 text-sm">{item.whatsapp || item.telefone || "—"}</td>
                <td className="p-4 text-sm">{item.email || "—"}</td>
                <td className="p-4 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado</p>
        )}
      </div>

      {showTrash && (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1E293B] text-white">
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-semibold uppercase">Nome</th>
                <th className="text-left p-4 text-xs font-semibold uppercase">Celular</th>
                <th className="text-left p-4 text-xs font-semibold uppercase">E-mail</th>
                <th className="text-left p-4 text-xs font-semibold uppercase">Excluído em</th>
                <th className="text-left p-4 text-xs font-semibold uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrash.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="p-4 text-sm">{item.nome}</td>
                  <td className="p-4 text-sm">{item.whatsapp || item.telefone || "—"}</td>
                  <td className="p-4 text-sm">{item.email || "—"}</td>
                  <td className="p-4 text-sm">
                    {item.excluido_em ? new Date(item.excluido_em).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="p-4 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => restoreCliente(item.id)}>
                      <Archive className="h-4 w-4 text-green-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrash.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Lixeira vazia</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="dados" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
              <TabsTrigger value="observacoes" className="flex-1">Observações</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>WhatsApp</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+55">🇧🇷 +55</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+351">🇵🇹 +351</SelectItem>
                        <SelectItem value="+34">🇪🇸 +34</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="(11) 99999-0000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Origem</Label>
                  <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} placeholder="Ex: Indicação, Google..." />
                </div>
                <div>
                  <Label>Tipo Pessoa</Label>
                  <Select value={form.tipo_pessoa} onValueChange={(v) => setForm({ ...form, tipo_pessoa: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {form.tipo_pessoa === "fisica" ? (
                  <>
                    <div>
                      <Label>CPF</Label>
                      <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                    </div>
                    <div>
                      <Label>RG</Label>
                      <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={form.cep}
                    onChange={(e) => setForm({ ...form, cep: e.target.value })}
                    onBlur={handleCepSearch}
                    placeholder="00000-000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Rua</Label>
                  <Input value={form.rua} onChange={(e) => setForm({ ...form, rua: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })} maxLength={2} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="observacoes" className="mt-4">
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações sobre o cliente..."
                rows={8}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clientes;
