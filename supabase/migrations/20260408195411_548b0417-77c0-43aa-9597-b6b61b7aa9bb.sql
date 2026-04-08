
-- Fix existing gerente: set oficina_id and role
UPDATE public.profiles 
SET oficina_id = 'f710d6e4-c316-4c18-b56e-d8c34e934358' 
WHERE id = '2aaf2e20-2639-42d4-a119-b3e1aa8fe421' AND oficina_id IS NULL;

UPDATE public.user_roles 
SET role = 'gerente' 
WHERE user_id = '2aaf2e20-2639-42d4-a119-b3e1aa8fe421' AND role = 'consultor';
