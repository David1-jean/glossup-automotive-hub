
-- Add new columns to protocolos
ALTER TABLE public.protocolos
  ADD COLUMN IF NOT EXISTS relato_cliente text,
  ADD COLUMN IF NOT EXISTS obs_os text,
  ADD COLUMN IF NOT EXISTS obs_int text,
  ADD COLUMN IF NOT EXISTS hora_entrega time without time zone,
  ADD COLUMN IF NOT EXISTS data_fechamento date,
  ADD COLUMN IF NOT EXISTS hora_fechamento time without time zone,
  ADD COLUMN IF NOT EXISTS corresponsavel_id uuid REFERENCES public.clientes(id),
  ADD COLUMN IF NOT EXISTS termo_autorizacao text;

-- Protocolo checklist items
CREATE TABLE public.protocolo_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  item text NOT NULL,
  condicao text DEFAULT 'ok',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocolo_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage protocolo_checklist via protocolo"
  ON public.protocolo_checklist FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM protocolos p WHERE p.id = protocolo_checklist.protocolo_id AND (p.oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'::app_role))));

-- Protocolo photos
CREATE TABLE public.protocolo_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  url text NOT NULL,
  peca text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocolo_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage protocolo_fotos via protocolo"
  ON public.protocolo_fotos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM protocolos p WHERE p.id = protocolo_fotos.protocolo_id AND (p.oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'::app_role))));

-- Protocolo serviços (funilaria/pintura and regular)
CREATE TABLE public.protocolo_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES public.servicos(id),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'servico',
  tamanho text,
  adicional_sem_pintura numeric DEFAULT 0,
  hora_linear boolean DEFAULT false,
  horas numeric DEFAULT 0,
  valor numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocolo_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage protocolo_servicos via protocolo"
  ON public.protocolo_servicos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM protocolos p WHERE p.id = protocolo_servicos.protocolo_id AND (p.oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'::app_role))));

-- Protocolo peças
CREATE TABLE public.protocolo_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  fracao numeric DEFAULT 1,
  qtd_tinta_p numeric DEFAULT 0,
  qtd_tinta_m numeric DEFAULT 0,
  qtd_tinta_g numeric DEFAULT 0,
  qtd_verniz_p numeric DEFAULT 0,
  qtd_verniz_m numeric DEFAULT 0,
  qtd_verniz_g numeric DEFAULT 0,
  sinonimos text,
  imagem_url text,
  valor numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocolo_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage protocolo_pecas via protocolo"
  ON public.protocolo_pecas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM protocolos p WHERE p.id = protocolo_pecas.protocolo_id AND (p.oficina_id = get_user_oficina_id(auth.uid()) OR has_role(auth.uid(), 'admin_master'::app_role))));

-- Storage bucket for protocolo photos
INSERT INTO storage.buckets (id, name, public) VALUES ('protocolo-fotos', 'protocolo-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload protocolo photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'protocolo-fotos');

CREATE POLICY "Anyone can view protocolo photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'protocolo-fotos');

CREATE POLICY "Authenticated users can delete protocolo photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'protocolo-fotos');
