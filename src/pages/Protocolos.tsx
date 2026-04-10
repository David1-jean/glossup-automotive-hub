import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Printer } from "lucide-react";
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

interface OficinaPrintData {
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  logo_url?: string | null;
}

interface ClientePrintData {
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  whatsapp: string | null;
  telefone: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

interface VeiculoPrintData {
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  cor: string | null;
  combustivel: string | null;
  chassi: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const hasValue = (value: unknown) => value !== null && value !== undefined && value !== "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const safeText = (value: string | number | null | undefined) => escapeHtml(value == null || value === "" ? "-" : String(value));

const buildAddress = (parts: Array<string | null | undefined>) => parts.filter(Boolean).join(", ");

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
  const [showPrintValues, setShowPrintValues] = useState(true);
  const [showPrintTermo, setShowPrintTermo] = useState(false);

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

  // Importar proposta
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
      console.error("[Protocolos] erro ao carregar serviços:", svcRes.error);
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

  const getProtocoloCode = (protocolo?: { id?: string } | null) => {
    if (protocolo?.id) {
      const originalIndex = protocolos.findIndex((item) => item.id === protocolo.id);
      if (originalIndex >= 0) {
        return (protocolos.length - originalIndex).toString().padStart(4, "0");
      }
    }

    return (protocolos.length + 1).toString().padStart(4, "0");
  };

  const handlePrint = async () => {
    if (!profile?.oficina_id) {
      toast.error("Oficina não identificada");
      return;
    }

    const [oficinaRes, clienteRes, veiculoRes] = await Promise.all([
      supabase.from("oficinas").select("nome, cnpj, endereco, telefone, whatsapp, logo_url").eq("id", profile.oficina_id).single(),
      form.cliente_id
        ? supabase.from("clientes").select("nome, cpf, cnpj, whatsapp, telefone, rua, numero, bairro, cidade, uf, cep").eq("id", form.cliente_id).single()
        : Promise.resolve({ data: null, error: null }),
      form.veiculo_id
        ? supabase.from("veiculos").select("marca, modelo, placa, ano_fabricacao, ano_modelo, cor, combustivel, chassi").eq("id", form.veiculo_id).single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (oficinaRes.error || !oficinaRes.data) {
      toast.error("Erro ao carregar dados da oficina para impressão");
      return;
    }

    if (clienteRes && "error" in clienteRes && clienteRes.error) {
      toast.error("Erro ao carregar dados do cliente para impressão");
      return;
    }

    if (veiculoRes && "error" in veiculoRes && veiculoRes.error) {
      toast.error("Erro ao carregar dados do veículo para impressão");
      return;
    }

    const oficina = oficinaRes.data as OficinaPrintData;
    const cliente = (clienteRes && "data" in clienteRes ? clienteRes.data : null) as ClientePrintData | null;
    const veiculo = (veiculoRes && "data" in veiculoRes ? veiculoRes.data : null) as VeiculoPrintData | null;
    const protocoloCode = getProtocoloCode(editing);
    const clienteDocumento = cliente?.cnpj || cliente?.cpf || "-";
    const clienteEndereco = buildAddress([cliente?.rua, cliente?.numero, cliente?.bairro, cliente?.cidade, cliente?.uf, cliente?.cep]);
    const servicosComValor = servicos.filter((item) => hasValue(item.valor));
    const pecasComValor = pecas.filter((item) => hasValue(item.valor));
    const servicosTotal = servicosComValor.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const pecasTotal = pecasComValor.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    const totalGeral = servicosTotal + pecasTotal;
    const assinaturaData = form.data_entrada ? new Date(`${form.data_entrada}T00:00:00`).toLocaleDateString("pt-BR") : "-";

    const serviceRows = servicos.length
      ? servicos.map((item) => {
          const valorNum = Number(item.valor);
          const temValor = item.valor !== null && item.valor !== undefined && item.valor !== "" && !isNaN(valorNum);
          return `
          <tr>
            <td>${safeText(item.nome)}</td>
            <td style="text-align:center">${safeText(item.horas || 0)}</td>
            ${showPrintValues ? `<td style="text-align:right">${temValor ? formatCurrency(valorNum) : "-"}</td>` : ""}
          </tr>`;
        }).join("")
      : `<tr><td colspan="${showPrintValues ? 3 : 2}" class="empty">Nenhum serviço informado</td></tr>`;

    const pecasRows = pecas.length
      ? pecas.map((item) => {
          const valorNum = Number(item.valor);
          const temValor = item.valor !== null && item.valor !== undefined && item.valor !== "" && !isNaN(valorNum);
          return `
          <tr>
            <td>${safeText(item.nome)}</td>
            ${showPrintValues ? `<td style="text-align:right">${temValor ? formatCurrency(valorNum) : "-"}</td>` : ""}
          </tr>`;
        }).join("")
      : `<tr><td colspan="${showPrintValues ? 2 : 1}" class="empty">Nenhuma peça informada</td></tr>`;

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Ordem de Serviço ${safeText(protocoloCode)}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
            .page { width: 100%; }
            .header, .row, .signature { display: flex; justify-content: space-between; gap: 20px; }
            .header { align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 16px; }
            .brand { display: flex; gap: 16px; align-items: flex-start; }
            .logo { width: 92px; height: 92px; border: 1px solid #d1d5db; border-radius: 8px; object-fit: contain; background: #fff; }
            .foto-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .foto-card { border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
            .foto-card img { width: 100%; height: 180px; object-fit: cover; }
            .foto-card .foto-info { padding: 8px 10px; font-size: 12px; }
            .foto-card .foto-info strong { display: block; margin-bottom: 2px; }
            .checklist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
            .checklist-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; }
            .checklist-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; }
            .checklist-ok { background: #dcfce7; color: #16a34a; }
            .checklist-pending { background: #fef3c7; color: #d97706; }
            .termo-section { white-space: pre-wrap; font-family: monospace; font-size: 13px; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; }
            .title { font-size: 26px; font-weight: 700; margin: 0 0 10px; }
            .meta { text-align: right; min-width: 180px; }
            .meta strong { display: block; font-size: 14px; color: #374151; }
            .meta span { display: block; font-size: 20px; font-weight: 700; margin-bottom: 10px; }
            .section { margin-bottom: 18px; }
            .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 10px; color: #374151; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
            .field { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; min-height: 56px; }
            .field-label { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
            .field-value { font-size: 14px; font-weight: 600; word-break: break-word; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 10px; font-size: 13px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; }
            .empty { text-align: center; color: #6b7280; }
            .totals { margin-top: 12px; display: flex; justify-content: flex-end; }
            .totals-box { min-width: 260px; border: 1px solid #111827; border-radius: 8px; padding: 12px 14px; }
            .totals-line { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-size: 14px; }
            .totals-line:last-child { margin-bottom: 0; font-size: 16px; font-weight: 700; }
            .signature { align-items: flex-end; margin-top: 28px; }
            .signature-box { flex: 1; }
            .signature-line { border-top: 1px solid #111827; padding-top: 8px; font-size: 13px; }
            .footer-note { margin-top: 18px; font-size: 12px; color: #4b5563; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">
                ${oficina.logo_url ? `<img class="logo" src="${escapeHtml(oficina.logo_url)}" alt="Logo da oficina" />` : ""}
                <div>
                  <h1 class="title">${safeText(oficina.nome)}</h1>
                  <div>${safeText(oficina.cnpj)}</div>
                  <div>${safeText(oficina.endereco)}</div>
                  <div>Telefone: ${safeText(oficina.telefone)}</div>
                  <div>WhatsApp: ${safeText(oficina.whatsapp)}</div>
                </div>
              </div>
              <div class="meta">
                <strong>Ordem de Serviço</strong>
                <span>#${safeText(protocoloCode)}</span>
                <strong>Data de abertura</strong>
                <div>${safeText(form.data_entrada ? new Date(`${form.data_entrada}T00:00:00`).toLocaleDateString("pt-BR") : "-")}</div>
              </div>
            </div>

            <section class="section">
              <h2>Dados do cliente</h2>
              <div class="grid">
                <div class="field"><span class="field-label">Nome</span><div class="field-value">${safeText(cliente?.nome || getClienteNome(form.cliente_id))}</div></div>
                <div class="field"><span class="field-label">CPF/CNPJ</span><div class="field-value">${safeText(clienteDocumento)}</div></div>
                <div class="field"><span class="field-label">WhatsApp</span><div class="field-value">${safeText(cliente?.whatsapp)}</div></div>
                <div class="field"><span class="field-label">Telefone</span><div class="field-value">${safeText(cliente?.telefone)}</div></div>
                <div class="field" style="grid-column: 1 / -1;"><span class="field-label">Endereço</span><div class="field-value">${safeText(clienteEndereco)}</div></div>
              </div>
            </section>

            <section class="section">
              <h2>Dados do veículo</h2>
              <div class="grid">
                <div class="field"><span class="field-label">Marca</span><div class="field-value">${safeText(veiculo?.marca)}</div></div>
                <div class="field"><span class="field-label">Modelo</span><div class="field-value">${safeText(veiculo?.modelo || getVeiculoLabel(form.veiculo_id))}</div></div>
                <div class="field"><span class="field-label">Placa</span><div class="field-value">${safeText(veiculo?.placa)}</div></div>
                <div class="field"><span class="field-label">Ano</span><div class="field-value">${safeText([veiculo?.ano_fabricacao, veiculo?.ano_modelo].filter(Boolean).join("/") || "-")}</div></div>
                <div class="field"><span class="field-label">Cor</span><div class="field-value">${safeText(veiculo?.cor)}</div></div>
                <div class="field"><span class="field-label">Combustível</span><div class="field-value">${safeText(veiculo?.combustivel)}</div></div>
                <div class="field"><span class="field-label">Chassi</span><div class="field-value">${safeText(veiculo?.chassi)}</div></div>
                <div class="field"><span class="field-label">Quilometragem</span><div class="field-value">${safeText(form.km)}</div></div>
              </div>
            </section>

            <section class="section">
              <h2>Serviços realizados</h2>
              <table>
                <thead>
                  <tr>
                    <th>Serviço</th>
                    <th style="width: 110px; text-align:center;">Horas</th>
                    ${showPrintValues ? '<th style="width: 150px; text-align:right;">Valor</th>' : ""}
                  </tr>
                </thead>
                <tbody>${serviceRows}</tbody>
              </table>
            </section>

            <section class="section">
              <h2>Peças utilizadas</h2>
              <table>
                <thead>
                  <tr>
                    <th>Peça</th>
                    ${showPrintValues ? '<th style="width: 150px; text-align:right;">Valor</th>' : ""}
                  </tr>
                </thead>
                <tbody>${pecasRows}</tbody>
              </table>
            </section>

            ${showPrintValues ? `
              <div class="totals">
                <div class="totals-box">
                  <div class="totals-line"><span>Total serviços</span><strong>${safeText(servicosComValor.length > 0 ? formatCurrency(servicosTotal) : "-")}</strong></div>
                  <div class="totals-line"><span>Total peças</span><strong>${safeText(pecasComValor.length > 0 ? formatCurrency(pecasTotal) : "-")}</strong></div>
                  <div class="totals-line"><span>Total geral</span><strong>${safeText(servicosComValor.length > 0 || pecasComValor.length > 0 ? formatCurrency(totalGeral) : "-")}</strong></div>
                </div>
              </div>` : ""}

            ${fotos.length > 0 ? `
            <section class="section">
              <h2>Registro fotográfico</h2>
              <div class="foto-grid">
                ${fotos.map((f) => `
                  <div class="foto-card">
                    <img src="${escapeHtml(f.url)}" alt="${safeText(f.peca)}" crossorigin="anonymous" />
                    <div class="foto-info">
                      ${f.peca ? `<strong>Peça: ${safeText(f.peca)}</strong>` : ""}
                      ${f.observacoes ? `<span>${safeText(f.observacoes)}</span>` : ""}
                    </div>
                  </div>
                `).join("")}
              </div>
            </section>` : ""}

            ${checklist.length > 0 ? `
            <section class="section">
              <h2>Checklist de vistoria</h2>
              <div class="checklist-grid">
                ${checklist.map((c) => `
                  <div class="checklist-item">
                    <span style="flex:1">${safeText(c.item)}</span>
                    <span class="checklist-badge ${c.condicao === 'ok' ? 'checklist-ok' : 'checklist-pending'}">${c.condicao === 'ok' ? 'OK' : 'Pendente'}</span>
                  </div>
                `).join("")}
              </div>
            </section>` : ""}

            <section class="section footer-note">
              <div>Previsão de entrega: ${safeText(form.previsao_entrega ? new Date(`${form.previsao_entrega}T00:00:00`).toLocaleDateString("pt-BR") : "-")}${form.hora_entrega ? ` às ${safeText(form.hora_entrega)}` : ""}</div>
              <div>Forma de pagamento: ${safeText(form.forma_pagamento)}</div>
            </section>

            <div class="signature">
              <div class="signature-box">
                <div class="signature-line">Assinatura do cliente: ${safeText(cliente?.nome || getClienteNome(form.cliente_id))}</div>
              </div>
              <div class="signature-box" style="max-width: 220px;">
                <div class="signature-line">Data: ${safeText(assinaturaData)}</div>
              </div>
            </div>

            ${showPrintTermo && form.termo_autorizacao ? `
            <div style="page-break-before: always;"></div>
            <section class="section" style="margin-top: 24px;">
              <h2>Termo de Autorização de Serviço</h2>
              <div class="termo-section">${escapeHtml(form.termo_autorizacao)}</div>
            </section>` : ""}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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
        servicos.map((s) => ({ protocolo_id: protocoloId, servico_id: s.servico_id || null, nome: s.nome, tipo: s.tipo, tamanho: s.tamanho || null, adicional_sem_pintura: s.adicional_sem_pintura || 0, hora_linear: s.hora_linear || false, horas: s.horas || 0, valor: s.valor ?? null }))
      ));
    }
    if (pecas.length > 0) {
      inserts.push(supabase.from("protocolo_pecas").insert(
        pecas.map((p) => ({ protocolo_id: protocoloId, nome: p.nome, fracao: p.fracao, qtd_tinta_p: p.qtd_tinta_p, qtd_tinta_m: p.qtd_tinta_m, qtd_tinta_g: p.qtd_tinta_g, qtd_verniz_p: p.qtd_verniz_p, qtd_verniz_m: p.qtd_verniz_m, qtd_verniz_g: p.qtd_verniz_g, sinonimos: p.sinonimos, imagem_url: p.imagem_url, valor: p.valor ?? null }))
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
      .map((it: any) => ({
        nome: it.descricao,
        tipo: "servico",
        horas: (Number(it.horas) || 0) * (Number(it.quantidade) || 1),
        valor: it.valor == null ? null : (Number(it.valor) || 0) * (Number(it.quantidade) || 1),
      }));
    const importedPecas = (proposta.itens_proposta || [])
      .filter((it: any) => it.tipo === "peca")
      .map((it: any) => ({
        nome: it.descricao, fracao: 1, qtd_tinta_p: 0, qtd_tinta_m: 0, qtd_tinta_g: 0,
        qtd_verniz_p: 0, qtd_verniz_m: 0, qtd_verniz_g: 0, sinonimos: "", imagem_url: "",
        valor: it.valor == null ? null : (Number(it.valor) || 0) * (Number(it.quantidade) || 1),
      }));
    setServicos([...servicos, ...importedServicos]);
    setPecas([...pecas, ...importedPecas]);
    setImportDialogOpen(false);
    toast.success("Proposta importada");
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
              <TabsTrigger value="funilaria">Serviços de funilaria e pintura</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="pecas">Peças</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-center mt-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                Importar proposta
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

          <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="show-print-values" checked={showPrintValues} onCheckedChange={(checked) => setShowPrintValues(checked === true)} />
                <Label htmlFor="show-print-values" className="text-sm">Exibir valores na impressão</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="show-print-termo" checked={showPrintTermo} onCheckedChange={(checked) => setShowPrintTermo(checked === true)} />
                <Label htmlFor="show-print-termo" className="text-sm">Imprimir termo de autorização</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir OS
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialogs */}
      <Dialog open={newClienteOpen} onOpenChange={setNewClienteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar novo cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do cliente</label>
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
          <DialogHeader><DialogTitle>Adicionar novo veículo</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>Importar proposta</DialogTitle></DialogHeader>
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
