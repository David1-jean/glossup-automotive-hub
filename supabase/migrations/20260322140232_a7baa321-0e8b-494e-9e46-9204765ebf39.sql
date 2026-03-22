
-- Create a default oficina for Admin Master
INSERT INTO public.oficinas (id, nome, cnpj, email, plano, status_assinatura, ativa)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'GlossHub Admin',
  NULL,
  'admin@glosshub.com',
  'pro',
  'ativa',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Link all existing admin_master users to this default oficina
UPDATE public.profiles
SET oficina_id = '00000000-0000-0000-0000-000000000001'
WHERE oficina_id IS NULL
AND id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin_master'
);
