
-- Recreate the trigger for handle_new_user (it was missing)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add RESTRICTIVE policies to enforce oficina_id isolation on ALL tenant tables
-- These combine with AND against any existing PERMISSIVE policies

-- CLIENTES
CREATE POLICY "restrict_clientes_by_oficina"
ON public.clientes AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- VEICULOS
CREATE POLICY "restrict_veiculos_by_oficina"
ON public.veiculos AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- PROTOCOLOS
CREATE POLICY "restrict_protocolos_by_oficina"
ON public.protocolos AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- PROPOSTAS
CREATE POLICY "restrict_propostas_by_oficina"
ON public.propostas AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- AGENDAMENTOS
CREATE POLICY "restrict_agendamentos_by_oficina"
ON public.agendamentos AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- FINANCEIRO
CREATE POLICY "restrict_financeiro_by_oficina"
ON public.financeiro AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- ESTOQUE
CREATE POLICY "restrict_estoque_by_oficina"
ON public.estoque AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- VALOR_HORA
CREATE POLICY "restrict_valor_hora_by_oficina"
ON public.valor_hora AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));

-- SERVICOS - special: allow oficina_id IS NULL (global services) for SELECT only
-- Drop existing permissive SELECT that allows NULL oficina_id, we'll handle it differently
-- We need a restrictive policy that allows own oficina OR null
CREATE POLICY "restrict_servicos_by_oficina"
ON public.servicos AS RESTRICTIVE FOR ALL TO authenticated
USING (oficina_id IS NULL OR oficina_id = get_user_oficina_id(auth.uid()))
WITH CHECK (oficina_id = get_user_oficina_id(auth.uid()));
