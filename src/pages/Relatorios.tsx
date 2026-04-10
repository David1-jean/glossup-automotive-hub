import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Relatorios = () => {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [protocoloServicos, setProtocoloServicos] = useState<any[]>([]);
  const [protocoloPecas, setProtocoloPecas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [protRes, svcRes, pecRes, cliRes, veicRes] = await Promise.all([
        supabase.from("protocolos").select("*").order("created_at", { ascending: false }),
        supabase.from("protocolo_servicos").select("*"),
        supabase.from("protocolo_pecas").select("*"),
        supabase.from("clientes").select("id, nome"),
        supabase.from("veiculos").select("id, modelo, placa"),
      ]);
      if (protRes.data) setProtocolos(protRes.data);
      if (svcRes.data) setProtocoloServicos(svcRes.data);
      if (pecRes.data) setProtocoloPecas(pecRes.data);
      if (cliRes.data) setClientes(cliRes.data);
      if (veicRes.data) setVeiculos(veicRes.data);
    };
    fetchAll();
  }, []);

  const rows = useMemo(() => {
    return protocolos
      .filter((p) => {
        const v = veiculos.find((ve) => ve.id === p.veiculo_id);
        const vLabel = v ? `${v.modelo || ""} ${v.placa || ""}`.trim() : "";
        const matchSearch = vLabel.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "Todos" || p.status.toLowerCase() === statusFilter.toLowerCase();
        let matchDate = true;
        if (dataInicio) matchDate = matchDate && (p.data_entrada || "") >= dataInicio;
        if (dataFim) matchDate = matchDate && (p.data_entrada || "") <= dataFim;
        return matchSearch && matchStatus && matchDate;
      })
      .map((p) => {
        const svcs = protocoloServicos.filter((s) => s.protocolo_id === p.id);
        const funilariaServicos = svcs.filter((s) => s.tipo === "funilaria");
        const regularServicos = svcs.filter((s) => s.tipo === "servico");
        const pcs = protocoloPecas.filter((pc) => pc.protocolo_id === p.id);

        const funilariaValor = funilariaServicos.reduce((acc: number, s: any) => acc + (Number(s.valor) || 0), 0);
        const funilariaHoras = funilariaServicos.reduce((acc: number, s: any) => acc + (Number(s.horas) || 0), 0);
        const funilariaPecas = funilariaServicos.length;
        const servicosValor = regularServicos.reduce((acc: number, s: any) => acc + (Number(s.valor) || 0), 0);
        const servicosHoras = regularServicos.reduce((acc: number, s: any) => acc + (Number(s.horas) || 0), 0);
        const vendaPecas = pcs.reduce((acc: number, pc: any) => acc + (Number(pc.valor) || 0), 0);
        const custoPecas = vendaPecas * 0.6; // estimated cost
        const lucroPecas = vendaPecas - custoPecas;
        const totalOS = funilariaValor + servicosValor + vendaPecas;

        const v = veiculos.find((ve) => ve.id === p.veiculo_id);

        return {
          id: p.id,
          veiculo_modelo: v?.modelo || "—",
          veiculo_placa: v?.placa || "",
          veiculo_full: v ? `${v.modelo || ""} ${v.placa || ""}`.trim() : "—",
          funilariaValor, funilariaHoras, funilariaPecas,
          servicosValor, servicosHoras,
          vendaPecas, custoPecas, lucroPecas, totalOS,
          status: p.status, previsao_entrega: p.previsao_entrega || "—",
        };
      });
  }, [protocolos, protocoloServicos, protocoloPecas, search, statusFilter, dataInicio, dataFim, veiculos]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => ({
        funilariaValor: acc.funilariaValor + r.funilariaValor,
        funilariaHoras: acc.funilariaHoras + r.funilariaHoras,
        servicosValor: acc.servicosValor + r.servicosValor,
        servicosHoras: acc.servicosHoras + r.servicosHoras,
        vendaPecas: acc.vendaPecas + r.vendaPecas,
        custoPecas: acc.custoPecas + r.custoPecas,
        lucroPecas: acc.lucroPecas + r.lucroPecas,
        totalOS: acc.totalOS + r.totalOS,
      }),
      { funilariaValor: 0, funilariaHoras: 0, servicosValor: 0, servicosHoras: 0, vendaPecas: 0, custoPecas: 0, lucroPecas: 0, totalOS: 0 }
    );
    const qtdOS = rows.length;
    const ticketMedio = qtdOS > 0 ? t.totalOS / qtdOS : 0;
    return { ...t, qtdOS, ticketMedio };
  }, [rows]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const getCustomStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "aberta") return <span className="inline-block px-3 py-1 rounded-md text-xs font-bold text-warning-foreground bg-warning/20 border border-warning/30 uppercase tracking-wider">Aberta</span>;
    if (s === "fechada") return <span className="inline-block px-3 py-1 rounded-md text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 shadow-sm uppercase tracking-wider">Fechada</span>;
    if (s === "quitada") return <span className="inline-block px-3 py-1 rounded-md text-xs font-bold text-success-foreground bg-success/20 border border-success/30 uppercase tracking-wider">Quitada</span>;
    return <span className="inline-block px-3 py-1 rounded-md text-xs font-bold text-muted-foreground bg-muted border border-border uppercase tracking-wider">{status}</span>;
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Ordens de Serviço", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["OS", "Veículo", "Fun/Pint", "Hrs Fun", "Peças P.", "Serviços", "Hrs Svc", "Venda P.", "Custo P.", "Lucro", "Total OS", "Status", "Prev."]],
      body: rows.map((r, i) => [
        String(i + 1).padStart(4, '0'), r.veiculo_full, fmt(r.funilariaValor), r.funilariaHoras, r.funilariaPecas,
        fmt(r.servicosValor), r.servicosHoras, fmt(r.vendaPecas), fmt(r.custoPecas),
        fmt(r.lucroPecas), fmt(r.totalOS), r.status, r.previsao_entrega,
      ]),
      foot: [["TOTAIS", "", fmt(totals.funilariaValor), totals.funilariaHoras, "",
        fmt(totals.servicosValor), totals.servicosHoras, fmt(totals.vendaPecas),
        fmt(totals.custoPecas), fmt(totals.lucroPecas), fmt(totals.totalOS), "", ""]],
      styles: { fontSize: 7, halign: 'right' },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' }, 11: { halign: 'center' }, 12: { halign: 'center' } },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(10);
    doc.text(`QTD Ordens de Serviço: ${totals.qtdOS}`, 14, finalY + 10);
    doc.text(`Ticket Médio: ${fmt(totals.ticketMedio)}`, 14, finalY + 16);
    doc.text(`Percentual sobre Receita: 100%`, 14, finalY + 22);

    doc.save("relatorio-os.pdf");
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Cabeçalho */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatório de Ordens de Serviço</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Data de geração: {new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Button onClick={exportPDF} size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm">
            <Download className="h-4 w-4 mr-2" /> Baixar PDF
          </Button>
        </div>
        <div className="h-px w-full bg-border mt-6"></div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar veículo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-background h-10" />
        </div>
        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40 bg-background h-10" placeholder="Data início" />
        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40 bg-background h-10" placeholder="Data fim" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {["Todos", "Aberta", "Quitada", "Fechada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela Principal */}
      <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1E293B] text-white">
              <tr>
                {["OS", "Veículo", "Funilaria/Pint.", "Hrs Fun.", "Peças Pint.", "Serviços", "Hrs Svc", "Venda Peças", "Custo Peças", "Lucro Peças", "Total OS", "Status", "Previsão"].map((h, i) => (
                  <th key={h} className={`p-4 font-semibold whitespace-nowrap ${(i >= 2 && i <= 10) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-muted/50 transition-colors bg-card even:bg-muted/30">
                  <td className="p-4 font-mono font-medium text-foreground">{String(i + 1).padStart(4, '0')}</td>
                  <td className="p-4 whitespace-nowrap">
                    <p className="font-semibold text-foreground">{r.veiculo_modelo}</p>
                    {r.veiculo_placa && <p className="text-xs text-muted-foreground mt-0.5">{r.veiculo_placa}</p>}
                  </td>
                  <td className="p-4 font-mono text-right">{fmt(r.funilariaValor)}</td>
                  <td className="p-4 font-mono text-right">{r.funilariaHoras}</td>
                  <td className="p-4 font-mono text-right">{r.funilariaPecas}</td>
                  <td className="p-4 font-mono text-right">{fmt(r.servicosValor)}</td>
                  <td className="p-4 font-mono text-right">{r.servicosHoras}</td>
                  <td className="p-4 font-mono text-right">{fmt(r.vendaPecas)}</td>
                  <td className="p-4 font-mono text-right">{fmt(r.custoPecas)}</td>
                  <td className="p-4 font-mono text-right text-success">{fmt(r.lucroPecas)}</td>
                  <td className="p-4 font-mono text-right font-bold text-primary text-base">{fmt(r.totalOS)}</td>
                  <td className="p-4">{getCustomStatusBadge(r.status)}</td>
                  <td className="p-4 whitespace-nowrap text-muted-foreground">{r.previsao_entrega}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Nenhum resultado encontrado para os filtros.</p>
          </div>
        )}
      </div>

      {/* Seção de Resumo (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Geral (Receita)</p>
          <p className="text-3xl font-bold text-primary">{fmt(totals.totalOS)}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Ordens de Serviço</p>
          <p className="text-3xl font-bold text-foreground">{totals.qtdOS}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Ticket Médio</p>
          <p className="text-3xl font-bold text-foreground">{fmt(totals.ticketMedio)}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-start border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">% sobre Receita</p>
          <p className="text-3xl font-bold text-foreground">100%</p>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
