import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Download } from "lucide-react";
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

  const getVeiculoLabel = (id: string | null) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.modelo || ""} ${v.placa || ""}`.trim() : "—";
  };

  const rows = useMemo(() => {
    return protocolos
      .filter((p) => {
        const matchSearch = getVeiculoLabel(p.veiculo_id).toLowerCase().includes(search.toLowerCase());
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

        return {
          id: p.id,
          veiculo: getVeiculoLabel(p.veiculo_id),
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

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Relatório de Ordens de Serviço", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["OS", "Veículo", "Fun/Pint (R$)", "Hrs Fun", "Peças Pint", "Serviços (R$)", "Hrs Svc", "Venda Peças", "Custo Peças", "Lucro Peças", "Total OS", "Status", "Previsão"]],
      body: rows.map((r, i) => [
        i + 1, r.veiculo, fmt(r.funilariaValor), r.funilariaHoras, r.funilariaPecas,
        fmt(r.servicosValor), r.servicosHoras, fmt(r.vendaPecas), fmt(r.custoPecas),
        fmt(r.lucroPecas), fmt(r.totalOS), r.status, r.previsao_entrega,
      ]),
      foot: [["TOTAIS", "", fmt(totals.funilariaValor), totals.funilariaHoras, "",
        fmt(totals.servicosValor), totals.servicosHoras, fmt(totals.vendaPecas),
        fmt(totals.custoPecas), fmt(totals.lucroPecas), fmt(totals.totalOS), "", ""]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [255, 107, 0] },
      footStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 180;
    doc.setFontSize(10);
    doc.text(`QTD Ordens de Serviço: ${totals.qtdOS}`, 14, finalY + 10);
    doc.text(`Ticket Médio: ${fmt(totals.ticketMedio)}`, 14, finalY + 16);
    doc.text(`Percentual sobre Receita: 100%`, 14, finalY + 22);

    doc.save("relatorio-os.pdf");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Button onClick={exportPDF} className="bg-primary hover:bg-primary/90"><Download className="h-4 w-4 mr-2" /> Baixar PDF</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar veículo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-40" placeholder="Data início" />
        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-40" placeholder="Data fim" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {["Todos", "Aberta", "Quitada", "Fechada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["OS", "Veículo", "Fun/Pint (R$)", "Hrs", "Peças Pint", "Serviços (R$)", "Hrs Svc", "Venda Peças", "Custo Peças", "Lucro Peças", "Total OS", "Status", "Previsão"].map((h) => (
                <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="p-3 text-sm font-mono">{i + 1}</td>
                <td className="p-3 text-sm whitespace-nowrap">{r.veiculo}</td>
                <td className="p-3 text-sm font-mono">{fmt(r.funilariaValor)}</td>
                <td className="p-3 text-sm font-mono">{r.funilariaHoras}</td>
                <td className="p-3 text-sm font-mono">{r.funilariaPecas}</td>
                <td className="p-3 text-sm font-mono">{fmt(r.servicosValor)}</td>
                <td className="p-3 text-sm font-mono">{r.servicosHoras}</td>
                <td className="p-3 text-sm font-mono">{fmt(r.vendaPecas)}</td>
                <td className="p-3 text-sm font-mono">{fmt(r.custoPecas)}</td>
                <td className="p-3 text-sm font-mono">{fmt(r.lucroPecas)}</td>
                <td className="p-3 text-sm font-mono font-bold">{fmt(r.totalOS)}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3 text-sm">{r.previsao_entrega}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado</p>}
      </div>

      {/* Footer totals */}
      <div className="glass-card p-4 border-t-2 border-primary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Totais</p>
            <p className="text-lg font-bold text-primary">{fmt(totals.totalOS)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Qtd Ordens de Serviço</p>
            <p className="text-lg font-bold">{totals.qtdOS}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Ticket Médio</p>
            <p className="text-lg font-bold">{fmt(totals.ticketMedio)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">% sobre Receita</p>
            <p className="text-lg font-bold">100%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
