-- Criar política RLS para permitir删除de clientes
-- Primeiro, verifique se RLS está ativado
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Criar política deDELETE para clientes
CREATE POLICY IF NOT EXISTS "permitir_delete_clientes" ON public.clientes
FOR DELETE USING (true);

-- também garantir que SELECT, INSERT, UPDATE funcionam
DROP POLICY IF EXISTS "permitir_select_clientes" ON public.clientes;
CREATE POLICY "permitir_select_clientes" ON public.clientes FOR SELECT USING (true);

DROP POLICY IF EXISTS "permitir_insert_clientes" ON public.clientes;
CREATE POLICY "permitir_insert_clientes" ON public.clientes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "permitir_update_clientes" ON public.clientes;
CREATE POLICY "permitir_update_clientes" ON public.clientes FOR UPDATE USING (true);