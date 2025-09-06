-- DIAGNÓSTICO DO SISTEMA DE STORAGE
-- Execute para verificar se tudo está configurado corretamente

-- Verificar buckets criados
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id IN ('avatars', 'carteiras', 'content-images')
ORDER BY id;

-- Verificar políticas RLS para storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Verificar se a coluna foto_url existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'foto_url';

-- Verificar tabela user_roles (para políticas admin)
SELECT COUNT(*) as total_admins
FROM public.user_roles 
WHERE role = 'admin';