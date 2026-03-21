import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Peca {
  id?: string;
  nome: string;
  fracao: number;
  qtd_tinta_p: number;
  qtd_tinta_m: number;
  qtd_tinta_g: number;
  qtd_verniz_p: number;
  qtd_verniz_m: number;
  qtd_verniz_g: number;
  sinonimos: string;
  imagem_url: string;
  valor: number;
}

interface Props {
  pecas: Peca[];
  setPecas: (p: Peca[]) => void;
}

const emptyPeca: Peca = {
  nome: "", fracao: 1, qtd_tinta_p: 0, qtd_tinta_m: 0, qtd_tinta_g: 0,
  qtd_verniz_p: 0, qtd_verniz_m: 0, qtd_verniz_g: 0, sinonimos: "", imagem_url: "", valor: 0,
};

export function ProtocoloPecasTab({ pecas, setPecas }: Props) {
  const addPeca = () => setPecas([...pecas, { ...emptyPeca }]);

  const updatePeca = (index: number, field: string, value: any) => {
    const updated = [...pecas];
    updated[index] = { ...updated[index], [field]: value };
    setPecas(updated);
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={addPeca}><Plus className="h-4 w-4 mr-2" /> Adicionar Peça</Button>

      {pecas.map((peca, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Peça #{i + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => setPecas(pecas.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label className="text-xs">Nome</Label><Input value={peca.nome} onChange={(e) => updatePeca(i, "nome", e.target.value)} /></div>
            <div><Label className="text-xs">Fração</Label><Input type="number" value={peca.fracao} onChange={(e) => updatePeca(i, "fracao", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Valor</Label><Input type="number" value={peca.valor} onChange={(e) => updatePeca(i, "valor", Number(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div><Label className="text-xs">Tinta P</Label><Input type="number" value={peca.qtd_tinta_p} onChange={(e) => updatePeca(i, "qtd_tinta_p", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Tinta M</Label><Input type="number" value={peca.qtd_tinta_m} onChange={(e) => updatePeca(i, "qtd_tinta_m", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Tinta G</Label><Input type="number" value={peca.qtd_tinta_g} onChange={(e) => updatePeca(i, "qtd_tinta_g", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Verniz P</Label><Input type="number" value={peca.qtd_verniz_p} onChange={(e) => updatePeca(i, "qtd_verniz_p", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Verniz M</Label><Input type="number" value={peca.qtd_verniz_m} onChange={(e) => updatePeca(i, "qtd_verniz_m", Number(e.target.value))} /></div>
            <div><Label className="text-xs">Verniz G</Label><Input type="number" value={peca.qtd_verniz_g} onChange={(e) => updatePeca(i, "qtd_verniz_g", Number(e.target.value))} /></div>
          </div>
          <div><Label className="text-xs">Sinônimos</Label><Input value={peca.sinonimos} onChange={(e) => updatePeca(i, "sinonimos", e.target.value)} placeholder="Nomes alternativos..." /></div>
        </div>
      ))}

      {pecas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma peça adicionada</p>}
    </div>
  );
}
