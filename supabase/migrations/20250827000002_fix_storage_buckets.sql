-- Correção: Buckets de Storage ausentes
-- Data: 27/08/2025
-- Objetivo: Criar buckets necessários para funcionamento do sistema

-- 1. Criar bucket 'carteiras' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'carteiras', 
    'carteiras', 
    false, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar bucket 'certificados' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'certificados', 
    'certificados', 
    false, 
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar bucket 'certidoes' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'certidoes', 
    'certidoes', 
    false, 
    10485760, -- 10MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de acesso para bucket 'carteiras'
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can upload their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own carteira photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own carteira photos" ON storage.objects;

-- Criar políticas para carteiras
CREATE POLICY "Users can upload their own carteira photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own carteira photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own carteira photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own carteira photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'carteiras' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 5. Políticas de acesso para bucket 'certificados'
CREATE POLICY "Users can upload their own certificados" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'certificados' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own certificados" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'certificados' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. Políticas de acesso para bucket 'certidoes'
CREATE POLICY "Users can view their own certidoes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'certidoes' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 7. Políticas administrativas para todos os buckets
CREATE POLICY "Admins can manage all carteiras" ON storage.objects
    FOR ALL USING (
        bucket_id = 'carteiras' AND
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'::app_role
        )
    );

CREATE POLICY "Admins can manage all certificados" ON storage.objects
    FOR ALL USING (
        bucket_id = 'certificados' AND
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'::app_role
        )
    );

CREATE POLICY "Admins can manage all certidoes" ON storage.objects
    FOR ALL USING (
        bucket_id = 'certidoes' AND
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'::app_role
        )
    );

-- 8. Comentários para documentação
COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento para arquivos do sistema';

-- 9. Verificação final
DO $$
DECLARE
    bucket_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count 
    FROM storage.buckets 
    WHERE id IN ('carteiras', 'certificados', 'certidoes');
    
    RAISE NOTICE 'Total de buckets configurados: %', bucket_count;
END $$;