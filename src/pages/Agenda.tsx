import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalIcon } from "lucide-react";

const Agenda = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button><Plus className="h-4 w-4 mr-2" /> Novo Agendamento</Button>
      </div>

      <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px]">
        <CalIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Calendário de agendamentos</p>
        <p className="text-sm text-muted-foreground mt-1">Conecte ao banco de dados para visualizar agendamentos</p>
      </div>
    </div>
  );
};

export default Agenda;
