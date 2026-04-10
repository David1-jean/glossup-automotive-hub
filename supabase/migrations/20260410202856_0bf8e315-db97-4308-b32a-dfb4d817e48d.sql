
-- Fix servicos RLS to allow reading standard (oficina_id IS NULL) services
DROP POLICY IF EXISTS "Users can view servicos of own oficina" ON public.servicos;

CREATE POLICY "Users can view servicos of own oficina" ON public.servicos
FOR SELECT TO authenticated
USING (
  oficina_id IS NULL 
  OR oficina_id = get_user_oficina_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin_master'::app_role)
);
