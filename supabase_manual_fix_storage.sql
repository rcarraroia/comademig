-- SCRIPT SIMPLIFICADO PARA PAINEL SUPABASE
-- Execute este script no SQL Editor do painel Supabase

-- ============================================================================
-- 1. CRIAR/ATUALIZAR BUCKETS (sem tocar nas políticas existentes)
-- ============================================================================

-- Bucket para avatars de usuários (público para visualização)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Bucket para fotos de carteiras (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'carteiras', 
    'carteiras', 
    false, 
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket para imagens de conteúdo (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'content-images', 
    'content-images', 
    true, 
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================================================
-- 2. VERIFICAÇÃO DOS BUCKETS CRIADOS
-- ============================================================================

DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    -- Verificar buckets criados
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id IN ('avatars', 'carteiras', 'content-images');
    
    RAISE NOTICE 'Buckets configurados: %', bucket_count;
    
    -- Mostrar detalhes dos buckets
    RAISE NOTICE 'Detalhes dos buckets:';
    FOR bucket_count IN 
        SELECT id, public, file_size_limit 
        FROM storage.buckets 
        WHERE id IN ('avatars', 'carteiras', 'content-images')
    LOOP
        RAISE NOTICE 'Bucket: % configurado', bucket_count;
    END LOOP;
END $$;