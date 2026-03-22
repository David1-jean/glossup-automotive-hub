
-- Add ON DELETE CASCADE to all tables referencing oficinas
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_oficina_id_fkey;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.veiculos DROP CONSTRAINT IF EXISTS veiculos_oficina_id_fkey;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.propostas DROP CONSTRAINT IF EXISTS propostas_oficina_id_fkey;
ALTER TABLE public.propostas ADD CONSTRAINT propostas_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.protocolos DROP CONSTRAINT IF EXISTS protocolos_oficina_id_fkey;
ALTER TABLE public.protocolos ADD CONSTRAINT protocolos_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS agendamentos_oficina_id_fkey;
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.financeiro DROP CONSTRAINT IF EXISTS financeiro_oficina_id_fkey;
ALTER TABLE public.financeiro ADD CONSTRAINT financeiro_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_oficina_id_fkey;
ALTER TABLE public.estoque ADD CONSTRAINT estoque_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.servicos DROP CONSTRAINT IF EXISTS servicos_oficina_id_fkey;
ALTER TABLE public.servicos ADD CONSTRAINT servicos_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

ALTER TABLE public.valor_hora DROP CONSTRAINT IF EXISTS valor_hora_oficina_id_fkey;
ALTER TABLE public.valor_hora ADD CONSTRAINT valor_hora_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE CASCADE;

-- Also cascade profiles oficina_id (set null on delete so user isn't lost)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_oficina_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_oficina_id_fkey FOREIGN KEY (oficina_id) REFERENCES public.oficinas(id) ON DELETE SET NULL;

-- Add DELETE policy for oficinas (admin only)
CREATE POLICY "Admin can delete oficinas" ON public.oficinas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin_master'::app_role));
