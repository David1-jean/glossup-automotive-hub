import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
} from "lucide-react";

interface Lancamento {
  id: string;
  oficina_id: string;
  tipo: string;
  descricao: string;
  valor: number;
  categoria: string | null;
  data: string;
}

const emptyForm = {
  tipo: "entrada",
  descricao: "",
  valor: "",
  categoria: "",
  data: new Date().toISOString().split("T")[0],
};

const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`));

const Financeiro = () => {
  const { profile } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!profile?.oficina_id) return;
    const { data } = await supabase.from("financeiro").select("*").eq("oficina_id", profile.oficina_id).order("data", { ascending: false });
    if (data) setLancamentos(data);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.oficina_id]);

  const filtered = lancamentos.filter((item) => {
    const query = search.toLowerCase();
    return item.descricao.toLowerCase().includes(query) || (item.categoria || "").toLowerCase().includes(query);
  });
  const totalEntradas = lancamentos.filter((item) => item.tipo === "entrada").reduce((acc, item) => acc + Number(item.valor), 0);
  const totalSaidas = lancamentos.filter((item) => item.tipo === "saida").reduce((acc, item) => acc + Number(item.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  const latestEntry = lancamentos[0];

  const handleOpen = (lancamento?: Lancamento) => {
    if (lancamento) {
      setEditing(lancamento);
      setForm({
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: lancamento.valor.toString(),
        categoria: lancamento.categoria || "",
        data: lancamento.data,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) {
      toast.error("Descricao e obrigatoria");
      return;
    }
    if (!profile?.oficina_id) {
      toast.error("Oficina nao identificada");
      return;
    }

    setLoading(true);
    const payload = {
      oficina_id: profile.oficina_id,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor) || 0,
      categoria: form.categoria || null,
      data: form.data,
    };

    const { error } = editing
      ? await supabase.from("financeiro").update(payload).eq("id", editing.id)
      : await supabase.from("financeiro").insert(payload);

    if (error) {
      toast.error("Erro ao salvar lancamento");
    } else {
      toast.success(editing ? "Lancamento atualizado" : "Lancamento criado");
      setDialogOpen(false);
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lancamento?")) return;
    const { error } = await supabase.from("financeiro").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Lancamento excluido");
      fetchData();
    }
  };

  return (
    <div className="page-shell animate-fade-in">
      <section className="glass-card overflow-hidden border-border/70">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div>
            <p className="section-heading">Financeiro</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Fluxo financeiro com leitura rapida</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Controle entradas, saidas e saldo da oficina com visao executiva, tabela clara e acesso rapido aos lancamentos.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => handleOpen()} className="h-11 rounded-xl px-5">
                <Plus className="mr-2 h-4 w-4" />
                Novo lancamento
              </Button>
              <div className="panel-muted flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
                <CalendarRange className="h-4 w-4 text-primary" />
                {latestEntry ? `Ultimo registro em ${formatDate(latestEntry.data)}` : "Sem movimentacoes registradas"}
              </div>
            </div>
          </div>

          <div className="panel-muted flex flex-col justify-between p-5">
            <div>
              <p className="section-heading">Resumo do caixa</p>
              <p className={`data-highlight mt-3 text-3xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatCurrency(saldo)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Saldo consolidado das movimentacoes cadastradas.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-background/80 p-4">
                <div className="flex items-center gap-2 text-success">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">Entradas</span>
                </div>
                <p className="data-highlight mt-2 text-lg font-bold text-success">{formatCurrency(totalEntradas)}</p>
              </div>
              <div className="rounded-2xl bg-background/80 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="text-sm font-medium">Saidas</span>
                </div>
                <p className="data-highlight mt-2 text-lg font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card border-border/70 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-success/10 p-3 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas</p>
              <p className="data-highlight text-2xl font-bold text-success">{formatCurrency(totalEntradas)}</p>
            </div>
          </div>
        </div>

        <div className="glass-card border-border/70 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saidas</p>
              <p className="data-highlight text-2xl font-bold text-destructive">{formatCurrency(totalSaidas)}</p>
            </div>
          </div>
        </div>

        <div className="glass-card border-border/70 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`data-highlight text-2xl font-bold ${saldo >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card border-border/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-heading">Lancamentos</p>
            <h2 className="mt-1 text-lg font-semibold">Historico financeiro</h2>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descricao ou categoria"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-xl border-border/70 pl-9"
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-muted/50">
                <tr className="border-b border-border/70">
                  {[
                    "Data",
                    "Descricao",
                    "Categoria",
                    "Tipo",
                    "Valor",
                    "Acoes",
                  ].map((header) => (
                    <th key={header} className="p-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 bg-card transition-colors hover:bg-muted/35">
                    <td className="p-4 text-sm whitespace-nowrap">{formatDate(item.data)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.descricao}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Registro financeiro da oficina</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.categoria || "Sem categoria"}</td>
                    <td className="p-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tipo === "entrada" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {item.tipo === "entrada" ? "Entrada" : "Saida"}
                      </span>
                    </td>
                    <td className={`data-highlight p-4 text-sm font-semibold ${item.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(Number(item.valor))}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(item)} className="rounded-xl">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-medium">Nenhum lancamento encontrado</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Ajuste o termo buscado ou crie um novo lancamento para iniciar o acompanhamento financeiro.
              </p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border/70">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lancamento" : "Novo lancamento"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(value) => setForm({ ...form, tipo: value })}>
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descricao</Label>
              <Input value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} className="mt-2 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Valor</Label>
                <Input type="number" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} className="mt-2 rounded-xl" />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(event) => setForm({ ...form, data: event.target.value })} className="mt-2 rounded-xl" />
              </div>
            </div>

            <div>
              <Label>Categoria</Label>
              <Input
                value={form.categoria}
                onChange={(event) => setForm({ ...form, categoria: event.target.value })}
                placeholder="Ex: Servicos, material, aluguel"
                className="mt-2 rounded-xl"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;
