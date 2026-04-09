import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FileDown } from "lucide-react";
import { ProtocoloDetalhesTab } from "@/components/protocolos/ProtocoloDetalhesTab";
import { ProtocoloAnotacoesTab } from "@/components/protocolos/ProtocoloAnotacoesTab";
import { ProtocoloLaudoTab, DEFAULT_TERMO } from "@/components/protocolos/ProtocoloLaudoTab";
import { ProtocoloFunilariaTab } from "@/components/protocolos/ProtocoloFunilariaTab";
import { ProtocoloServicosTab } from "@/components/protocolos/ProtocoloServicosTab";
import { ProtocoloPecasTab } from "@/components/protocolos/ProtocoloPecasTab";

const emptyForm = {
  cliente_id: "", veiculo_id: "", status: "aberta", status_assinatura: "não assinado",
  data_entrada: new Date().toISOString().split("T")[0],
  hora_entrada: new Date().toTimeString().slice(0, 5),
  km: "", previsao_entrega: "", hora_entrega: "", data_fechamento: "", hora_fechamento: "",
  forma_pagamento: "", corresponsavel_id: "", relato_cliente: "", obs_os: "", obs_int: "",
  termo_autorizacao: DEFAULT_TERMO,
};

const Protocolos = () => {
  const { profile } = useAuth();
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [veiculos, setVeiculos] = useState<{ id: string; modelo: string | null; placa: string | null }[]>([]);
  const [servicosCadastrados, setServicosCadastrados] = useState<{ id: string; nome: string; oficina_id: string | null }[]>([]);
  const [servicosCadastradosError, setServicosCadastradosError] = useState("");
  const [propostas, setPropostas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  // Sub-entity states
  const [servicos, setServicos] = useState<any[]>([]);
  const [pecas, setPecas] = useState<any[]>([]);
  const [fotos, setFotos] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);

  // Quick Adds
  const [newClienteOpen, setNewClienteOpen] = useState(false);
  const [newVeiculoOpen, setNewVeiculoOpen] = useState(false);
  const [newClienteNome, setNewClienteNome] = useState("");
  const [newVeiculoModelo, setNewVeiculoModelo] = useState("");
  const [newVeiculoPlaca, setNewVeiculoPlaca] = useState("");

  // Import proposta
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState("");

  const fetchData = async () => {
    if (!profile?.oficina_id) {
      setServicosCadastrados([]);
      setServicosCadastradosError("Oficina não identificada para carregar os serviços.");
      return;
    }

    setServicosCadastradosError("");

    const [protRes, cliRes, veicRes, svcRes, propRes] = await Promise.all([
      supabase.from("protocolos").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome").order("nome"),
      supabase.from("veiculos").select("id, modelo, placa").order("modelo"),
      supabase.from("servicos").select("id, nome, oficina_id").or(`oficina_id.is.null,oficina_id.eq.${profile.oficina_id}`),
      supabase.from("propostas").select("*, itens_proposta(*)").order("created_at", { ascending: false }),
    ]);

    if (svcRes.error) {
      console.error("[Protocolos] erro ao carregar servicos:", svcRes.error);
      setServicosCadastrados([]);
      setServicosCadastradosError("Erro ao carregar os serviços cadastrados.");
    } else {
      const servicosOrdenados = (svcRes.data || []).sort((a, b) => {
        if (a.oficina_id === null && b.oficina_id !== null) return -1;
        if (a.oficina_id !== null && b.oficina_id === null) return 1;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

      setServicosCadastrados(servicosOrdenados);
    }

    if (protRes.data) setProtocolos(protRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (veicRes.data) setVeiculos(veicRes.data);
    if (propRes.data) setPropostas(propRes.data);
  };

  useEffect(() => { fetchData(); }, [profile?.oficina_id]);

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

  const handleOpen = async (protocolo?: any) => {
    if (protocolo) {
      setEditing(protocolo);
      setForm({
        cliente_id: protocolo.cliente_id || "", veiculo_id: protocolo.veiculo_id || "",
        status: protocolo.status, status_assinatura: protocolo.status_assinatura,
        data_entrada: protocolo.data_entrada || "", hora_entrada: protocolo.hora_entrada || "",
        km: protocolo.km || "", previsao_entrega: protocolo.previsao_entrega || "",
        hora_entrega: protocolo.hora_entrega || "", data_fechamento: protocolo.data_fechamento || "",
        hora_fechamento: protocolo.hora_fechamento || "", forma_pagamento: protocolo.forma_pagamento || "",
        corresponsavel_id: protocolo.corresponsavel_id || "",
        relato_cliente: protocolo.relato_cliente || "", obs_os: protocolo.obs_os || "",
        obs_int: protocolo.obs_int || "", termo_autorizacao: protocolo.termo_autorizacao || DEFAULT_TERMO,
      });
      // Load sub-entities
      const [svcRes, pecRes, fotoRes, checkRes] = await Promise.all([
        supabase.from("protocolo_servicos").select("*").eq("protocolo_id", protocolo.id),
        supabase.from("protocolo_pecas").select("*").eq("protocolo_id", protocolo.id),
        supabase.from("protocolo_fotos").select("*").eq("protocolo_id", protocolo.id),
        supabase.from("protocolo_checklist").select("*").eq("protocolo_id", protocolo.id),
      ]);
      setServicos(svcRes.data || []);
      setPecas(pecRes.data || []);
      setFotos(fotoRes.data || []);
      setChecklist(checkRes.data || []);
    } else {
      setEditing(null);
      setForm({ ...emptyForm, data_entrada: new Date().toISOString().split("T")[0], hora_entrada: new Date().toTimeString().slice(0, 5) });
      setServicos([]); setPecas([]); setFotos([]); setChecklist([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    setLoading(true);
    const payload: any = {
      oficina_id: profile.oficina_id, cliente_id: form.cliente_id || null,
      veiculo_id: form.veiculo_id || null, status: form.status,
      status_assinatura: form.status_assinatura, data_entrada: form.data_entrada || null,
      hora_entrada: form.hora_entrada || null, km: form.km || null,
      previsao_entrega: form.previsao_entrega || null, hora_entrega: form.hora_entrega || null,
      data_fechamento: form.data_fechamento || null, hora_fechamento: form.hora_fechamento || null,
      forma_pagamento: form.forma_pagamento || null, corresponsavel_id: form.corresponsavel_id || null,
      relato_cliente: form.relato_cliente || null, obs_os: form.obs_os || null,
      obs_int: form.obs_int || null, termo_autorizacao: form.termo_autorizacao || null,
      observacoes: form.relato_cliente || null,
    };

    let protocoloId = editing?.id;

    if (editing) {
      const { error } = await supabase.from("protocolos").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao salvar"); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("protocolos").insert(payload).select().single();
      if (error) { toast.error("Erro ao salvar"); setLoading(false); return; }
      protocoloId = data.id;
    }

    // Save sub-entities: delete + re-insert
    await Promise.all([
      supabase.from("protocolo_servicos").delete().eq("protocolo_id", protocoloId),
      supabase.from("protocolo_pecas").delete().eq("protocolo_id", protocoloId),
      supabase.from("protocolo_fotos").delete().eq("protocolo_id", protocoloId),
      supabase.from("protocolo_checklist").delete().eq("protocolo_id", protocoloId),
    ]);

    const inserts = [];
    if (servicos.length > 0) {
      inserts.push(supabase.from("protocolo_servicos").insert(
        servicos.map((s) => ({ protocolo_id: protocoloId, servico_id: s.servico_id || null, nome: s.nome, tipo: s.tipo, tamanho: s.tamanho || null, adicional_sem_pintura: s.adicional_sem_pintura || 0, hora_linear: s.hora_linear || false, horas: s.horas || 0, valor: s.valor || 0 }))
      ));
    }
    if (pecas.length > 0) {
      inserts.push(supabase.from("protocolo_pecas").insert(
        pecas.map((p) => ({ protocolo_id: protocoloId, nome: p.nome, fracao: p.fracao, qtd_tinta_p: p.qtd_tinta_p, qtd_tinta_m: p.qtd_tinta_m, qtd_tinta_g: p.qtd_tinta_g, qtd_verniz_p: p.qtd_verniz_p, qtd_verniz_m: p.qtd_verniz_m, qtd_verniz_g: p.qtd_verniz_g, sinonimos: p.sinonimos, imagem_url: p.imagem_url, valor: p.valor || 0 }))
      ));
    }
    if (fotos.length > 0) {
      inserts.push(supabase.from("protocolo_fotos").insert(
        fotos.map((f) => ({ protocolo_id: protocoloId, url: f.url, peca: f.peca, observacoes: f.observacoes }))
      ));
    }
    if (checklist.length > 0) {
      inserts.push(supabase.from("protocolo_checklist").insert(
        checklist.map((c) => ({ protocolo_id: protocoloId, item: c.item, condicao: c.condicao }))
      ));
    }
    await Promise.all(inserts);

    toast.success(editing ? "Protocolo atualizado" : "Protocolo criado");
    setDialogOpen(false);
    fetchData();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este protocolo?")) return;
    const { error } = await supabase.from("protocolos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Protocolo excluído"); fetchData(); }
  };

  const handleAddCliente = async () => {
    if (!newClienteNome.trim() || !profile?.oficina_id) {
        toast.error("Nome do cliente é obrigatório");
        return;
    }
    const { data, error } = await supabase.from("clientes").insert({ nome: newClienteNome.trim(), oficina_id: profile.oficina_id }).select().single();
    if (error) { toast.error("Erro ao adicionar cliente"); return; }
    setClientes((prev) => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)));
    setForm({ ...form, cliente_id: data.id });
    setNewClienteNome("");
    setNewClienteOpen(false);
    toast.success("Cliente adicionado com sucesso");
  };

  const handleAddVeiculo = async () => {
    if (!newVeiculoModelo.trim() || !profile?.oficina_id || !form.cliente_id) {
        toast.error("Selecione um cliente primeiro e informe o modelo do veículo");
        return;
    }
    const { data, error } = await supabase.from("veiculos").insert({ 
      modelo: newVeiculoModelo.trim(), placa: newVeiculoPlaca.trim(), 
      oficina_id: profile.oficina_id, cliente_id: form.cliente_id 
    }).select().single();
    if (error) { toast.error("Erro ao adicionar veículo"); return; }
    setVeiculos((prev) => [...prev, data]);
    setForm({ ...form, veiculo_id: data.id });
    setNewVeiculoModelo("");
    setNewVeiculoPlaca("");
    setNewVeiculoOpen(false);
    toast.success("Veículo adicionado com sucesso");
  };

  const handleImportProposta = () => {
    const proposta = propostas.find((p) => p.id === selectedProposta);
    if (!proposta) return;
    setForm({ ...form, cliente_id: proposta.cliente_id || "", veiculo_id: proposta.veiculo_id || "" });
    const importedServicos = (proposta.itens_proposta || [])
      .filter((it: any) => it.tipo === "servico")
      .map((it: any) => ({ nome: it.descricao, tipo: "servico", horas: it.horas || 0, valor: it.valor || 0 }));
    const importedPecas = (proposta.itens_proposta || [])
      .filter((it: any) => it.tipo === "peca")
      .map((it: any) => ({
        nome: it.descricao, fracao: 1, qtd_tinta_p: 0, qtd_tinta_m: 0, qtd_tinta_g: 0,
        qtd_verniz_p: 0, qtd_verniz_m: 0, qtd_verniz_g: 0, sinonimos: "", imagem_url: "", valor: it.valor || 0,
      }));
    setServicos([...servicos, ...importedServicos]);
    setPecas([...pecas, ...importedPecas]);
    setImportDialogOpen(false);
    toast.success("Orçamento importado");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Protocolos de Serviço</h1>
        <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" /> Novo Protocolo</Button>
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
          <thead className="bg-[#1E293B] text-white">
            <tr className="border-b border-border">
              {["Cód", "Cliente", "Veículo", "Data", "KM", "Status", "Assinatura", "Ações"].map((h) => (
                <th key={h} className="text-left p-4 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const totalItems = protocolos.length;
              const originalIndex = protocolos.findIndex(p => p.id === item.id);
              const seqNumber = (totalItems - originalIndex).toString().padStart(4, '0');
              const codDisplay = seqNumber;

              return (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-4 text-sm font-mono whitespace-nowrap text-muted-foreground">{codDisplay}</td>
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
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Protocolo" : "Novo Protocolo"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
              <TabsTrigger value="laudo">Laudo/Termo</TabsTrigger>
              <TabsTrigger value="funilaria">Serviços Funilaria e Pintura</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="pecas">Peças</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-center mt-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                Importar orçamento
              </Button>
            </div>

            <TabsContent value="detalhes">
              <ProtocoloDetalhesTab form={form} setForm={setForm} clientes={clientes} veiculos={veiculos} onNewCliente={() => setNewClienteOpen(true)} onNewVeiculo={() => {
                if (!form.cliente_id) {
                  toast.error("Por favor, selecione um cliente primeiro antes de adicionar um veículo.");
                  return;
                }
                setNewVeiculoOpen(true);
              }} />
            </TabsContent>
            <TabsContent value="anotacoes">
              <ProtocoloAnotacoesTab form={form} setForm={setForm} />
            </TabsContent>
            <TabsContent value="laudo">
              <ProtocoloLaudoTab fotos={fotos} setFotos={setFotos} checklist={checklist} setChecklist={setChecklist} termo={form.termo_autorizacao} setTermo={(t) => setForm({ ...form, termo_autorizacao: t })} protocolo_id={editing?.id} />
            </TabsContent>
            <TabsContent value="funilaria">
              <ProtocoloFunilariaTab servicos={servicos} setServicos={setServicos} servicosCadastrados={servicosCadastrados} loadError={servicosCadastradosError} />
            </TabsContent>
            <TabsContent value="servicos">
              <ProtocoloServicosTab servicos={servicos} setServicos={setServicos} servicosCadastrados={servicosCadastrados} tipo="servico" loadError={servicosCadastradosError} />
            </TabsContent>
            <TabsContent value="pecas">
              <ProtocoloPecasTab pecas={pecas} setPecas={setPecas} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialogs */}
      <Dialog open={newClienteOpen} onOpenChange={setNewClienteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do Cliente</label>
              <Input placeholder="Ex: João da Silva" value={newClienteNome} onChange={(e) => setNewClienteNome(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewClienteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddCliente}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newVeiculoOpen} onOpenChange={setNewVeiculoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Veículo</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Modelo</label>
              <Input placeholder="Ex: Corolla" value={newVeiculoModelo} onChange={(e) => setNewVeiculoModelo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Placa</label>
              <Input placeholder="Ex: ABC-1234" value={newVeiculoPlaca} onChange={(e) => setNewVeiculoPlaca(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewVeiculoOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddVeiculo}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Proposta Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar Orçamento</DialogTitle></DialogHeader>
          <Select value={selectedProposta} onValueChange={setSelectedProposta}>
            <SelectTrigger><SelectValue placeholder="Selecione uma proposta" /></SelectTrigger>
            <SelectContent>
              {propostas.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {getClienteNome(p.cliente_id)} - {getVeiculoLabel(p.veiculo_id)} ({p.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleImportProposta} disabled={!selectedProposta}>Importar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Protocolos;
