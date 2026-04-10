import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Search } from "lucide-react";

interface Servico {
  id?: string;
  servico_id?: string;
  nome: string;
  tipo: string;
  horas: number;
  valor?: number | null;
}

interface Props {
  servicos: Servico[];
  setServicos: (s: Servico[]) => void;
  servicosCadastrados: { id: string; nome: string; oficina_id: string | null }[];
  tipo: "servico";
  loadError?: string;
}

export function ProtocoloServicosTab({ servicos, setServicos, servicosCadastrados, tipo, loadError }: Props) {
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = servicosCadastrados.filter((s) => !normalizedSearch || s.nome.toLowerCase().includes(normalizedSearch));

  const toggleServico = (svc: { id: string; nome: string }) => {
    const exists = servicos.find((s) => s.servico_id === svc.id && s.tipo === tipo);
    if (exists) {
      setServicos(servicos.filter((s) => !(s.servico_id === svc.id && s.tipo === tipo)));
    } else {
      setServicos([...servicos, { servico_id: svc.id, nome: svc.nome, tipo, horas: 0, valor: null }]);
    }
  };

  const updateServico = (index: number, field: string, value: any) => {
    const updated = [...servicos];
    updated[index] = { ...updated[index], [field]: value };
    setServicos(updated);
  };

  const currentServicos = servicos.filter((s) => s.tipo === tipo);

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" onClick={() => setShowPicker((current) => !current)}>
        <Plus className="h-4 w-4 mr-2" /> Adicionar serviços
      </Button>

      {showPicker && (
        <div className="glass-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md border border-border/60 bg-background/60 p-1 space-y-1">
            {loadError ? (
              <p className="text-sm text-destructive text-center py-3">{loadError}</p>
            ) : filtered.length > 0 ? (
              filtered.map((svc) => (
                <label key={svc.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 cursor-pointer">
                  <Checkbox
                    checked={!!servicos.find((s) => s.servico_id === svc.id && s.tipo === tipo)}
                    onCheckedChange={() => toggleServico(svc)}
                  />
                  <span className="flex-1 text-sm">{svc.nome}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {svc.oficina_id ? "Oficina" : "Padrão"}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum serviço encontrado</p>
            )}
          </div>
        </div>
      )}

      {currentServicos.length > 0 && (
        <div className="space-y-2">
          {currentServicos.map((svc, idx) => {
            const realIdx = servicos.findIndex((s) => s === svc);
            return (
              <div key={idx} className="p-3 rounded-md border border-border space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm flex-1 font-medium">{svc.nome}</span>
                  <Button variant="ghost" size="icon" onClick={() => setServicos(servicos.filter((_, i) => i !== realIdx))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Horas</Label>
                    <Input type="number" value={svc.horas} onChange={(e) => updateServico(realIdx, "horas", Number(e.target.value))} />
                  </div>
                  <div>
                     <Label className="text-xs">Valor do serviço</Label>
                     <Input
                       type="number"
                       placeholder="Ex: 350"
                       value={svc.valor ?? ""}
                       onChange={(e) => updateServico(realIdx, "valor", e.target.value === "" ? null : Number(e.target.value))}
                     />
                     <p className="mt-1 text-[11px] text-muted-foreground">Esse valor aparece na impressão da OS.</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentServicos.length === 0 && !showPicker && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço adicionado</p>
      )}
    </div>
  );
}
