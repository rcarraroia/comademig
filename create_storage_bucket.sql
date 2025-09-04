-- SCRIPT SIMPLIFICADO PARA CRIAR BUCKET DE IMAGENS
-- Execute APENAS a parte 1 no SQL Editor, depois configure as políticas pela interface

-- ========================================
-- PARTE 1: CRIAR BUCKET (Execute no SQL Editor)
-- ========================================

-- Criar bucket content-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'content-images';

-- ========================================
-- PARTE 2: CONFIGURAR POLÍTICAS (Via Interface do Supabase)
-- ========================================

-- Após executar a PARTE 1, vá para:
-- Painel Supabase > Storage > content-images > Configuration > Policies

-- Crie as seguintes políticas manualmente:

-- 1. POLÍTICA DE LEITURA PÚBLICA:
--    Nome: "Public can view content images"
--    Operação: SELECT
--    Target roles: public
--    USING expression: true

-- 2. POLÍTICA DE UPLOAD PARA ADMINS:
--    Nome: "Admins can upload content images"  
--    Operação: INSERT
--    Target roles: authenticated
--    USING expression: 
--    EXISTS (
--      SELECT 1 FROM user_roles 
--      WHERE user_id = auth.uid() AND role = 'admin'::app_role
--    )

-- 3. POLÍTICA DE UPDATE PARA ADMINS:
--    Nome: "Admins can update content images"
--    Operação: UPDATE  
--    Target roles: authenticated
--    USING expression:
--    EXISTS (
--      SELECT 1 FROM user_roles 
--      WHERE user_id = auth.uid() AND role = 'admin'::app_role
--    )

-- 4. POLÍTICA DE DELETE PARA ADMINS:
--    Nome: "Admins can delete content images"
--    Operação: DELETE
--    Target roles: authenticated  
--    USING expression:
--    EXISTS (
--      SELECT 1 FROM user_roles 
--      WHERE user_id = auth.uid() AND role = 'admin'::app_role
--    )