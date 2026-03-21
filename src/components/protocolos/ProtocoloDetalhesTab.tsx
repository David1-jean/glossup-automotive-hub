import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

interface Props {
  form: any;
  setForm: (f: any) => void;
  clientes: { id: string; nome: string }[];
  veiculos: { id: string; modelo: string | null; placa: string | null }[];
  onNewCliente: () => void;
  onNewVeiculo: () => void;
}

const FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Cartão débito", "Cartão crédito", "Parcelado"];

export function ProtocoloDetalhesTab({ form, setForm, clientes, veiculos, onNewCliente, onNewVeiculo }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Cliente</Label>
          <div className="flex gap-1">
            <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={onNewCliente}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <Label>Veículo</Label>
          <div className="flex gap-1">
            <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.modelo} {v.placa}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={onNewVeiculo}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><Label>Data Entrada</Label><Input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })} /></div>
        <div><Label>Hora Entrada</Label><Input type="time" value={form.hora_entrada} onChange={(e) => setForm({ ...form, hora_entrada: e.target.value })} /></div>
        <div><Label>Kilometragem</Label><Input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} /></div>
        <div><Label>Previsão Entrega</Label><Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} /></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><Label>Hora Entrega</Label><Input type="time" value={form.hora_entrega} onChange={(e) => setForm({ ...form, hora_entrega: e.target.value })} /></div>
        <div><Label>Data Fechamento</Label><Input type="date" value={form.data_fechamento} onChange={(e) => setForm({ ...form, data_fechamento: e.target.value })} /></div>
        <div><Label>Hora Fechamento</Label><Input type="time" value={form.hora_fechamento} onChange={(e) => setForm({ ...form, hora_fechamento: e.target.value })} /></div>
        <div>
          <Label>Forma Pagamento</Label>
          <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["aberta", "quitada", "fechada"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Corresponsável Financeiro</Label>
          <div className="flex gap-1">
            <Select value={form.corresponsavel_id} onValueChange={(v) => setForm({ ...form, corresponsavel_id: v })}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={onNewCliente}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Assinatura</Label>
          <Select value={form.status_assinatura} onValueChange={(v) => setForm({ ...form, status_assinatura: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="não assinado">Não Assinado</SelectItem>
              <SelectItem value="assinado">Assinado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
