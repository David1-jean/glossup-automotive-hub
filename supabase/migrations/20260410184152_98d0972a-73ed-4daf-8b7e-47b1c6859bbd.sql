
-- Drop old user_id-based policies
DROP POLICY IF EXISTS "delete_clientes" ON public.clientes;
DROP POLICY IF EXISTS "insert_clientes" ON public.clientes;
DROP POLICY IF EXISTS "select_clientes" ON public.clientes;
DROP POLICY IF EXISTS "update_clientes" ON public.clientes;

-- Create oficina-based policies (same pattern as other tables)
CREATE POLICY "Users can view clientes of own oficina"
  ON public.clientes FOR SELECT TO authenticated
  USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

CREATE POLICY "Users can insert clientes in own oficina"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

CREATE POLICY "Users can update clientes of own oficina"
  ON public.clientes FOR UPDATE TO authenticated
  USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));

CREATE POLICY "Users can delete clientes of own oficina"
  ON public.clientes FOR DELETE TO authenticated
  USING ((oficina_id = get_user_oficina_id(auth.uid())) OR has_role(auth.uid(), 'admin_master'::app_role));
