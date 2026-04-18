import { useState, useEffect, useRef } from "react";
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
import { Plus, Search, Pencil, Trash2, FileDown, MessageCircle, ImagePlus, Download } from "lucide-react";
import { gerarPropostaPdf } from "@/lib/propostaPdf";

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

interface PropostaImagem {
  id: string;
  url: string;
  storage_path: string | null;
}

const emptyForm = {
  cliente_id: "",
  veiculo_id: "",
  status: "pendente",
  observacoes: "",
};

const emptyItem: ItemProposta = { tipo: "servico", descricao: "", quantidade: 1, horas: 0, valor: 0 };

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_MB = 5;

const Propostas = () => {
  const { profile, user } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string; telefone?: string | null; whatsapp?: string | null; email?: string | null }[]>([]);
  const [veiculos, setVeiculos] = useState<{ id: string; modelo: string | null; placa: string | null; marca?: string | null; ano_modelo?: number | null; cor?: string | null }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proposta | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [itens, setItens] = useState<ItemProposta[]>([{ ...emptyItem }]);
  const [imagens, setImagens] = useState<PropostaImagem[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [propRes, cliRes, veicRes] = await Promise.all([
      supabase.from("propostas").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nome, telefone, whatsapp, email").order("nome"),
      supabase.from("veiculos").select("id, modelo, placa, marca, ano_modelo, cor").order("modelo"),
    ]);
    if (propRes.data) setPropostas(propRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (veicRes.data) setVeiculos(veicRes.data);
  };

  useEffect(() => { fetchData(); }, []);

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

  const fetchImagens = async (propostaId: string) => {
    const { data } = await supabase
      .from("proposta_imagens")
      .select("id, url, storage_path")
      .eq("proposta_id", propostaId)
      .order("created_at");
    setImagens(data || []);
  };

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
      await fetchImagens(proposta.id);
    } else {
      setEditing(null);
      setForm(emptyForm);
      setItens([{ ...emptyItem }]);
      setImagens([]);
    }
    setDialogOpen(true);
  };

  const calcTotal = () => itens.reduce((sum, i) => sum + (i.valor * i.quantidade), 0);

  const ensurePropostaSaved = async (): Promise<string | null> => {
    if (editing) return editing.id;
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return null; }
    const total = calcTotal();
    const { data, error } = await supabase.from("propostas").insert({
      oficina_id: profile.oficina_id,
      cliente_id: form.cliente_id || null,
      veiculo_id: form.veiculo_id || null,
      consultor_id: user?.id || null,
      status: form.status,
      observacoes: form.observacoes || null,
      total,
    }).select("*").single();
    if (error || !data) { toast.error("Salve a proposta antes de enviar imagens"); return null; }
    setEditing(data);
    fetchData();
    return data.id;
  };

  const handleUploadImagem = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (imagens.length + files.length > MAX_IMAGES) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens por proposta`);
      return;
    }
    const propostaId = await ensurePropostaSaved();
    if (!propostaId) return;

    setUploadingImg(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: máximo ${MAX_IMAGE_SIZE_MB}MB`);
          continue;
        }
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: arquivo não é imagem`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${propostaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("proposta-imagens").upload(path, file);
        if (upErr) { toast.error(`Erro no upload: ${file.name}`); continue; }
        const { data: pub } = supabase.storage.from("proposta-imagens").getPublicUrl(path);
        const { data: row, error: insErr } = await supabase.from("proposta_imagens").insert({
          proposta_id: propostaId,
          url: pub.publicUrl,
          storage_path: path,
        }).select("id, url, storage_path").single();
        if (insErr || !row) {
          await supabase.storage.from("proposta-imagens").remove([path]);
          toast.error(`Erro ao registrar ${file.name}`);
          continue;
        }
        setImagens((prev) => [...prev, row]);
      }
      toast.success("Imagens enviadas");
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImagem = async (img: PropostaImagem) => {
    if (img.storage_path) {
      await supabase.storage.from("proposta-imagens").remove([img.storage_path]);
    }
    await supabase.from("proposta_imagens").delete().eq("id", img.id);
    setImagens((prev) => prev.filter((i) => i.id !== img.id));
    toast.success("Imagem removida");
  };

  const handleDownloadImagem = async (img: PropostaImagem) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = img.storage_path?.split("/").pop() || `imagem-${img.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Não foi possível baixar a imagem");
    }
  };

  const buildPdfData = async (propostaId: string) => {
    const cli = clientes.find((c) => c.id === form.cliente_id) || null;
    const veic = veiculos.find((v) => v.id === form.veiculo_id) || null;
    const { data: oficina } = await supabase
      .from("oficinas")
      .select("nome, cnpj, endereco, telefone, whatsapp, email, logo_url")
      .eq("id", profile!.oficina_id!)
      .maybeSingle();
    return {
      numero: propostaId.slice(0, 8).toUpperCase(),
      data: editing ? new Date(editing.created_at) : new Date(),
      oficina: oficina || {},
      cliente: cli ? { nome: cli.nome, telefone: cli.telefone, whatsapp: cli.whatsapp, email: cli.email } : { nome: "—" },
      veiculo: veic ? { modelo: veic.modelo, marca: veic.marca, placa: veic.placa, ano_modelo: veic.ano_modelo, cor: veic.cor } : {},
      itens: itens.filter((i) => i.descricao.trim()),
      total: calcTotal(),
      observacoes: form.observacoes,
      imagens: imagens.map((i) => i.url),
      validadeDias: 30,
    };
  };

  const handleExportPdf = async () => {
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    const propostaId = await ensurePropostaSaved();
    if (!propostaId) return;
    setGeneratingPdf(true);
    try {
      const data = await buildPdfData(propostaId);
      const doc = await gerarPropostaPdf(data);
      doc.save(`Orcamento-${data.numero}.pdf`);
      toast.success("PDF gerado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (!profile?.oficina_id) { toast.error("Oficina não identificada"); return; }
    const cli = clientes.find((c) => c.id === form.cliente_id);
    const fone = (cli?.whatsapp || cli?.telefone || "").replace(/\D/g, "");
    if (!fone) { toast.error("Cliente sem WhatsApp/telefone cadastrado"); return; }

    const propostaId = await ensurePropostaSaved();
    if (!propostaId) return;
    setSendingWa(true);
    try {
      const data = await buildPdfData(propostaId);
      const doc = await gerarPropostaPdf(data);
      const blob = doc.output("blob");
      const path = `${propostaId}/orcamento-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("proposta-imagens")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("proposta-imagens").getPublicUrl(path);

      const veic = veiculos.find((v) => v.id === form.veiculo_id);
      const total = calcTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      const veicTxt = veic ? `${veic.modelo || ""} ${veic.placa ? "(" + veic.placa + ")" : ""}`.trim() : "—";
      const msg =
        `Olá, ${cli?.nome || "cliente"}! 👋\n\n` +
        `Segue o orçamento Nº ${data.numero} referente ao veículo ${veicTxt}.\n\n` +
        `💰 *Total: R$ ${total}*\n\n` +
        `📄 PDF do orçamento: ${pub.publicUrl}\n\n` +
        `Qualquer dúvida estou à disposição!`;

      const numero = fone.startsWith("55") ? fone : `55${fone}`;
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success("WhatsApp aberto");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao preparar envio");
    } finally {
      setSendingWa(false);
    }
  };

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
    await supabase.from("proposta_imagens").delete().eq("proposta_id", id);
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

            {/* Imagens */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Imagens ({imagens.length}/{MAX_IMAGES})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImg || imagens.length >= MAX_IMAGES}
                >
                  <ImagePlus className="h-3 w-3 mr-1" /> {uploadingImg ? "Enviando..." : "Adicionar"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadImagem(e.target.files)}
                />
              </div>
              {imagens.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma imagem anexada. Máx {MAX_IMAGES} imagens, {MAX_IMAGE_SIZE_MB}MB cada.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imagens.map((img) => (
                    <div key={img.id} className="relative group rounded-md overflow-hidden border border-border aspect-square">
                      <img src={img.url} alt="Imagem da proposta" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleDownloadImagem(img)} title="Baixar">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDeleteImagem(img)} title="Remover">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} /></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportPdf} disabled={generatingPdf}>
                <FileDown className="h-4 w-4 mr-1" /> {generatingPdf ? "Gerando..." : "Exportar PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={handleEnviarWhatsApp}
                disabled={sendingWa}
                className="text-green-700 border-green-600 hover:bg-green-50"
              >
                <MessageCircle className="h-4 w-4 mr-1" /> {sendingWa ? "Preparando..." : "Enviar no WhatsApp"}
              </Button>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Propostas;
