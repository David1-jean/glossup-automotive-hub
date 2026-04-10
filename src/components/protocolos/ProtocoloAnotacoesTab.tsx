import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  form: any;
  setForm: (f: any) => void;
}

export function ProtocoloAnotacoesTab({ form, setForm }: Props) {
  return (
    <Tabs defaultValue="relato" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="relato" className="flex-1">Relato do cliente</TabsTrigger>
        <TabsTrigger value="obs_os" className="flex-1">Observações da OS</TabsTrigger>
        <TabsTrigger value="obs_int" className="flex-1">Observações internas</TabsTrigger>
      </TabsList>
      <TabsContent value="relato">
        <Label>Relato do Cliente</Label>
        <Textarea rows={8} value={form.relato_cliente} onChange={(e) => setForm({ ...form, relato_cliente: e.target.value })} placeholder="Descreva o relato do cliente..." />
      </TabsContent>
      <TabsContent value="obs_os">
        <Label>Observações da OS</Label>
        <Textarea rows={8} value={form.obs_os} onChange={(e) => setForm({ ...form, obs_os: e.target.value })} placeholder="Observações da ordem de serviço..." />
      </TabsContent>
      <TabsContent value="obs_int">
        <Label>Observações internas</Label>
        <Textarea rows={8} value={form.obs_int} onChange={(e) => setForm({ ...form, obs_int: e.target.value })} placeholder="Observações internas (não visíveis ao cliente)..." />
      </TabsContent>
    </Tabs>
  );
}
