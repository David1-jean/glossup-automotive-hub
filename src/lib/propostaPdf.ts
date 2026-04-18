import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfOficina {
  nome?: string | null;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

export interface PdfCliente {
  nome?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

export interface PdfVeiculo {
  modelo?: string | null;
  marca?: string | null;
  placa?: string | null;
  ano_modelo?: number | null;
  cor?: string | null;
}

export interface PdfItem {
  tipo: string;
  descricao: string;
  quantidade: number;
  horas: number;
  valor: number;
}

export interface PdfPropostaData {
  numero: string;
  data: Date;
  oficina: PdfOficina;
  cliente: PdfCliente;
  veiculo: PdfVeiculo;
  itens: PdfItem[];
  total: number;
  observacoes?: string | null;
  imagens?: string[];
  validadeDias?: number;
}

const fmtCurrency = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function urlToDataUrl(url: string): Promise<{ dataUrl: string; format: string } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const format = blob.type.includes("png") ? "PNG" : "JPEG";
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export async function gerarPropostaPdf(data: PdfPropostaData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // ===== Cabeçalho =====
  if (data.oficina.logo_url) {
    const logo = await urlToDataUrl(data.oficina.logo_url);
    if (logo) {
      try {
        doc.addImage(logo.dataUrl, logo.format, margin, y, 28, 28);
      } catch {
        // ignora se imagem inválida
      }
    }
  }

  const headerX = margin + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 107, 0);
  doc.text(data.oficina.nome || "Oficina", headerX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  let hy = y + 12;
  if (data.oficina.cnpj) { doc.text(`CNPJ: ${data.oficina.cnpj}`, headerX, hy); hy += 4; }
  if (data.oficina.endereco) { doc.text(data.oficina.endereco, headerX, hy); hy += 4; }
  const contatos = [
    data.oficina.telefone && `Tel: ${data.oficina.telefone}`,
    data.oficina.whatsapp && `WhatsApp: ${data.oficina.whatsapp}`,
    data.oficina.email,
  ].filter(Boolean).join(" • ");
  if (contatos) { doc.text(contatos, headerX, hy); hy += 4; }

  y = Math.max(y + 32, hy + 4);
  doc.setDrawColor(255, 107, 0);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ===== Título proposta =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 17, 17);
  doc.text(`ORÇAMENTO Nº ${data.numero}`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Data: ${data.data.toLocaleDateString("pt-BR")}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );
  y += 7;

  // ===== Cliente / Veículo =====
  const boxY = y;
  const boxH = 26;
  const colW = (pageWidth - margin * 2 - 4) / 2;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, boxY, colW, boxH, 1.5, 1.5, "FD");
  doc.roundedRect(margin + colW + 4, boxY, colW, boxH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 107, 0);
  doc.text("CLIENTE", margin + 3, boxY + 5);
  doc.text("VEÍCULO", margin + colW + 7, boxY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  const cliLines = [
    data.cliente.nome || "—",
    data.cliente.telefone || data.cliente.whatsapp || "",
    data.cliente.email || "",
  ].filter(Boolean);
  cliLines.forEach((line, i) => doc.text(line, margin + 3, boxY + 11 + i * 4.5));

  const veicLines = [
    [data.veiculo.marca, data.veiculo.modelo].filter(Boolean).join(" ") || "—",
    data.veiculo.placa ? `Placa: ${data.veiculo.placa}` : "",
    [data.veiculo.ano_modelo, data.veiculo.cor].filter(Boolean).join(" • "),
  ].filter(Boolean);
  veicLines.forEach((line, i) => doc.text(String(line), margin + colW + 7, boxY + 11 + i * 4.5));

  y = boxY + boxH + 6;

  // ===== Itens =====
  autoTable(doc, {
    startY: y,
    head: [["Tipo", "Descrição", "Qtd", "Horas", "Valor Unit.", "Subtotal"]],
    body: data.itens.map((i) => [
      i.tipo === "peca" ? "Peça" : "Serviço",
      i.descricao,
      String(i.quantidade),
      String(i.horas || 0),
      fmtCurrency(i.valor),
      fmtCurrency(i.valor * i.quantidade),
    ]),
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [33, 33, 33] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error lastAutoTable é injetado pelo autotable
  y = doc.lastAutoTable.finalY + 5;

  // ===== Total =====
  doc.setFillColor(255, 107, 0);
  doc.roundedRect(pageWidth - margin - 70, y, 70, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`TOTAL: ${fmtCurrency(data.total)}`, pageWidth - margin - 3, y + 6.8, { align: "right" });
  y += 16;

  // ===== Observações =====
  if (data.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text("Observações", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const split = doc.splitTextToSize(data.observacoes, pageWidth - margin * 2);
    doc.text(split, margin, y);
    y += split.length * 4.5 + 4;
  }

  // ===== Imagens =====
  if (data.imagens && data.imagens.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text("Imagens", margin, y);
    y += 5;

    const imgW = 55;
    const imgH = 40;
    const gap = 5;
    let x = margin;
    for (const url of data.imagens) {
      const img = await urlToDataUrl(url);
      if (!img) continue;
      if (x + imgW > pageWidth - margin) { x = margin; y += imgH + gap; }
      if (y + imgH > pageHeight - 25) { doc.addPage(); y = margin; x = margin; }
      try {
        doc.addImage(img.dataUrl, img.format, x, y, imgW, imgH);
      } catch {
        // ignora imagens inválidas
      }
      x += imgW + gap;
    }
    y += imgH + 8;
  }

  // ===== Rodapé =====
  const validade = data.validadeDias ?? 30;
  const footerY = pageHeight - 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Orçamento válido por ${validade} dias a partir da data de emissão.`,
    margin,
    footerY + 2
  );
  doc.setFont("helvetica", "normal");
  doc.text("__________________________", pageWidth - margin, footerY + 2, { align: "right" });
  doc.text("Assinatura", pageWidth - margin - 12, footerY + 6, { align: "right" });

  return doc;
}
