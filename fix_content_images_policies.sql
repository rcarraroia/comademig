-- 🔍 DIAGNÓSTICO E CORREÇÃO DAS POLÍTICAS DO BUCKET content-images
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas atuais para content-images
SELECT 
    policyname, 
    cmd, 
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (qual LIKE '%content-images%' OR with_check LIKE '%content-images%')
ORDER BY policyname;

-- 2. Verificar status do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Remover todas as políticas conflitantes para content-images
-- (Execute apenas se houver políticas problemáticas)

-- DROP POLICY IF EXISTS "Give anon users access to JPG images in folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow all uploads to content-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;

-- 4. Criar políticas funcionais para content-images

-- Política para visualização pública (SELECT)
CREATE POLICY "content_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'content-images');

-- Política para upload por usuários autenticados (INSERT)
CREATE POLICY "content_images_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'content-images' 
    AND auth.role() = 'authenticated'
);

-- Política para atualização por usuários autenticados (UPDATE)
CREATE POLICY "content_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'content-images' 
    AND auth.role() = 'authenticated'
);

-- Política para exclusão por usuários autenticados (DELETE)
CREATE POLICY "content_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'content-images' 
    AND auth.role() = 'authenticated'
);

-- 5. Verificar se as políticas foram criadas
SELECT 
    policyname, 
    cmd, 
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%content_images%'
ORDER BY policyname;