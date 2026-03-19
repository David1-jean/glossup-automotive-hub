-- Add missing columns to oficinas
ALTER TABLE public.oficinas
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS plano text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS data_inicio timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ativa boolean NOT NULL DEFAULT true;