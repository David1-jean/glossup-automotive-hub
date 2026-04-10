-- Adicionar coluna avatar_url na tabela profiles, se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;