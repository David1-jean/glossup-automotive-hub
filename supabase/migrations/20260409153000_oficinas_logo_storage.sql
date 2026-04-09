ALTER TABLE public.oficinas
  ADD COLUMN IF NOT EXISTS logo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('oficinas-logos', 'oficinas-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload oficinas logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload oficinas logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'oficinas-logos');

DROP POLICY IF EXISTS "Anyone can view oficinas logos" ON storage.objects;
CREATE POLICY "Anyone can view oficinas logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'oficinas-logos');

DROP POLICY IF EXISTS "Authenticated users can update oficinas logos" ON storage.objects;
CREATE POLICY "Authenticated users can update oficinas logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'oficinas-logos')
  WITH CHECK (bucket_id = 'oficinas-logos');

DROP POLICY IF EXISTS "Authenticated users can delete oficinas logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete oficinas logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'oficinas-logos');
