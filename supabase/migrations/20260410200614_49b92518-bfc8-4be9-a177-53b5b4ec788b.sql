
-- Drop the old broken policy
DROP POLICY IF EXISTS "select_clientes" ON public.clientes;
DROP POLICY IF EXISTS "insert_clientes" ON public.clientes;
DROP POLICY IF EXISTS "update_clientes" ON public.clientes;
DROP POLICY IF EXISTS "delete_clientes" ON public.clientes;

-- SELECT
CREATE POLICY "select_clientes" ON public.clientes
FOR SELECT TO authenticated
USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

-- INSERT
CREATE POLICY "insert_clientes" ON public.clientes
FOR INSERT TO authenticated
WITH CHECK ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

-- UPDATE
CREATE POLICY "update_clientes" ON public.clientes
FOR UPDATE TO authenticated
USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

-- DELETE
CREATE POLICY "delete_clientes" ON public.clientes
FOR DELETE TO authenticated
USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));
