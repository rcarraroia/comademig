-- CORREÇÃO COMPLETA DO SISTEMA DE STORAGE
-- Data: 06/09/2025
-- Objetivo: Resolver todos os conflitos de buckets e políticas RLS

-- ============================================================================
-- 1. LIMPEZA COMPLETA DE POLÍTICAS CONFLITANTES
-- ============================================================================

-- Remover TODAS as políticas existentes para storage.objects
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus próprios avatares" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can manage all carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all carteiras" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own certificados" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own certificados" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all certificados" ON storage.objects;

DROP POLICY IF EXISTS "Users can view their own certidoes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all certidoes" ON storage.objects;

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;

DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "News images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode ver imagens de eventos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus próprios comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode ver conteúdo multimídia" ON storage.objects;

-- ============================================================================
-- 2. CRIAR/ATUALIZAR BUCKETS COM CONFIGURAÇÕES CONSISTENTES
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

-- Bucket para certificados (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'certificados', 
    'certificados', 
    false, 
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Bucket para certidões (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'certidoes', 
    'certidoes', 
    false, 
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- ============================================================================
-- 3. CRIAR POLÍTICAS RLS CONSISTENTES E FUNCIONAIS
-- ============================================================================

-- AVATARS - Público para visualização, usuários podem gerenciar os próprios
CREATE POLICY "avatars_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "avatars_update_own" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "avatars_delete_own" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- CARTEIRAS - Privado, usuários veem apenas as próprias
CREATE POLICY "carteiras_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "carteiras_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "carteiras_update_own" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "carteiras_delete_own" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- CONTENT-IMAGES - Público para visualização, admins podem gerenciar
CREATE POLICY "content_images_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "content_images_insert_admin" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'content-images' AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "content_images_update_admin" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'content-images' AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "content_images_delete_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'content-images' AND
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- CERTIFICADOS - Privado, usuários veem apenas os próprios
CREATE POLICY "certificados_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'certificados' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "certificados_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certificados' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- CERTIDOES - Privado, usuários veem apenas as próprias
CREATE POLICY "certidoes_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'certidoes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "certidoes_insert_own" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certidoes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- POLÍTICAS ADMINISTRATIVAS - Admins podem gerenciar tudo
CREATE POLICY "admin_manage_all_storage" ON storage.objects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON POLICY "avatars_select_public" ON storage.objects IS 'Permite visualização pública de avatars';
COMMENT ON POLICY "avatars_insert_own" ON storage.objects IS 'Usuários podem fazer upload de seus próprios avatars';
COMMENT ON POLICY "carteiras_select_own" ON storage.objects IS 'Usuários podem ver apenas suas próprias fotos de carteira';
COMMENT ON POLICY "content_images_select_public" ON storage.objects IS 'Imagens de conteúdo são públicas';
COMMENT ON POLICY "admin_manage_all_storage" ON storage.objects IS 'Administradores podem gerenciar todos os arquivos';

-- ============================================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Verificar buckets criados
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id IN ('avatars', 'carteiras', 'content-images', 'certificados', 'certidoes');
    
    -- Verificar políticas criadas
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage';
    
    RAISE NOTICE 'Sistema de storage configurado: % buckets, % políticas', bucket_count, policy_count;
END $$;