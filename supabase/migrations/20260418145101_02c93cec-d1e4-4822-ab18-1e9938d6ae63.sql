-- Bucket público para imagens das propostas
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposta-imagens', 'proposta-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do storage
CREATE POLICY "Proposta imagens são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'proposta-imagens');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens de propostas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposta-imagens');

CREATE POLICY "Usuários autenticados podem atualizar imagens de propostas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'proposta-imagens');

CREATE POLICY "Usuários autenticados podem deletar imagens de propostas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'proposta-imagens');

-- Tabela para vincular imagens às propostas
CREATE TABLE public.proposta_imagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposta_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage proposta_imagens via proposta oficina"
ON public.proposta_imagens
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.propostas p
  WHERE p.id = proposta_imagens.proposta_id
    AND (p.oficina_id = public.get_user_oficina_id(auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.propostas p
  WHERE p.id = proposta_imagens.proposta_id
    AND (p.oficina_id = public.get_user_oficina_id(auth.uid()) OR public.has_role(auth.uid(), 'admin_master'::app_role))
));

CREATE INDEX idx_proposta_imagens_proposta_id ON public.proposta_imagens(proposta_id);