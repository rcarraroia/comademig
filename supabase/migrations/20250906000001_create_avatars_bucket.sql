-- Criar bucket para avatars de usuários
-- Data: 06/09/2025
-- Objetivo: Permitir upload de fotos de perfil dos usuários

-- 1. Criar bucket 'avatars' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso para bucket 'avatars'

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Criar políticas para avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view all avatars" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'avatars'
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 3. Comentários para documentação
COMMENT ON POLICY "Users can upload their own avatar" ON storage.objects IS 'Permite que usuários façam upload de seus próprios avatars';
COMMENT ON POLICY "Users can view all avatars" ON storage.objects IS 'Permite que todos vejam avatars (público)';
COMMENT ON POLICY "Users can update their own avatar" ON storage.objects IS 'Permite que usuários atualizem seus próprios avatars';
COMMENT ON POLICY "Users can delete their own avatar" ON storage.objects IS 'Permite que usuários excluam seus próprios avatars';