import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Foto {
  id?: string;
  url: string;
  peca: string;
  observacoes: string;
}

interface ChecklistItem {
  id?: string;
  item: string;
  condicao: string;
}

const DEFAULT_CHECKLIST = [
  "Faróis", "Lanternas", "Setas", "Retrovisores", "Para-brisa", "Vidros laterais",
  "Limpador de para-brisa", "Pneus", "Estepe", "Macaco", "Chave de roda", "Triângulo",
  "Antena", "Calotas", "Tapetes", "Bateria", "Rádio/Som", "Ar condicionado",
  "Documento do veículo", "Chave reserva", "Manual do proprietário",
];

interface Props {
  fotos: Foto[];
  setFotos: (f: Foto[]) => void;
  checklist: ChecklistItem[];
  setChecklist: (c: ChecklistItem[]) => void;
  termo: string;
  setTermo: (t: string) => void;
  protocolo_id?: string;
}

const DEFAULT_TERMO = `TERMO DE AUTORIZAÇÃO DE SERVIÇO

Autorizo a oficina a realizar os serviços descritos neste protocolo no veículo acima identificado.
Declaro estar ciente dos serviços a serem executados, bem como dos valores previamente acordados.
O prazo de entrega poderá sofrer alterações conforme necessidade técnica, mediante comunicação prévia.
Peças substituídas serão devolvidas ao cliente, salvo disposição em contrário.
A oficina não se responsabiliza por objetos pessoais deixados no interior do veículo.

Ao assinar este documento, concordo com todas as condições aqui estabelecidas.

_________________________________________
Assinatura do Cliente

_________________________________________
Data`;

export function ProtocoloLaudoTab({ fotos, setFotos, checklist, setChecklist, termo, setTermo, protocolo_id }: Props) {
  const [uploading, setUploading] = useState(false);

  const initChecklist = () => {
    setChecklist(DEFAULT_CHECKLIST.map((item) => ({ item, condicao: "ok" })));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${protocolo_id || "temp"}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("protocolo-fotos").upload(path, file);
    if (error) { toast.error("Erro ao enviar foto"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("protocolo-fotos").getPublicUrl(data.path);
    setFotos([...fotos, { url: urlData.publicUrl, peca: "", observacoes: "" }]);
    setUploading(false);
  };

  return (
    <Tabs defaultValue="fotos" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="fotos" className="flex-1">Registro por Imagem</TabsTrigger>
        <TabsTrigger value="checklist" className="flex-1">Checklist</TabsTrigger>
        <TabsTrigger value="termo" className="flex-1">Termo de Autorização</TabsTrigger>
      </TabsList>

      <TabsContent value="fotos" className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" asChild disabled={uploading}>
              <span><Camera className="h-4 w-4 mr-2" />{uploading ? "Enviando..." : "Adicionar Foto"}</span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fotos.map((foto, i) => (
            <div key={i} className="glass-card p-3 space-y-2">
              <img src={foto.url} alt="" className="w-full h-40 object-cover rounded-md" />
              <Input placeholder="Peça" value={foto.peca} onChange={(e) => {
                const updated = [...fotos]; updated[i] = { ...updated[i], peca: e.target.value }; setFotos(updated);
              }} />
              <Input placeholder="Observações" value={foto.observacoes} onChange={(e) => {
                const updated = [...fotos]; updated[i] = { ...updated[i], observacoes: e.target.value }; setFotos(updated);
              }} />
              <Button variant="ghost" size="sm" onClick={() => setFotos(fotos.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        {fotos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma foto adicionada</p>}
      </TabsContent>

      <TabsContent value="checklist" className="space-y-4">
        {checklist.length === 0 && (
          <Button variant="outline" onClick={initChecklist}><Plus className="h-4 w-4 mr-2" /> Iniciar Checklist Padrão</Button>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-md border border-border">
              <Checkbox
                checked={item.condicao === "ok"}
                onCheckedChange={(checked) => {
                  const updated = [...checklist];
                  updated[i] = { ...updated[i], condicao: checked ? "ok" : "pendente" };
                  setChecklist(updated);
                }}
              />
              <span className="text-sm flex-1">{item.item}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.condicao === "ok" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}`}>
                {item.condicao === "ok" ? "OK" : "Pendente"}
              </span>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="termo">
        <Label>Termo de Autorização de Serviço</Label>
        <Textarea rows={16} value={termo || DEFAULT_TERMO} onChange={(e) => setTermo(e.target.value)} className="font-mono text-sm" />
      </TabsContent>
    </Tabs>
  );
}

export { DEFAULT_TERMO };
