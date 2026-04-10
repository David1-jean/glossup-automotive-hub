-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_extensions, avatar)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['jpg', 'jpeg', 'png', 'webp'], true)
ON CONFLICT (id) DO NOTHING;