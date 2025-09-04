-- SCRIPT PARA CRIAR BUCKET DE IMAGENS NO SUPABASE STORAGE
-- Execute este script no SQL Editor do painel Supabase

-- 1. Criar bucket content-images (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar políticas RLS para o bucket content-images

-- Política para leitura pública (qualquer um pode ver as imagens)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'content-images-public-read',
  'content-images',
  'Public can view content images',
  'true',
  NULL,
  'SELECT'
)
ON CONFLICT (id) DO NOTHING;

-- Política para admins poderem fazer upload
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'content-images-admin-upload',
  'content-images',
  'Admins can upload content images',
  '(EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''::app_role))',
  '(EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''::app_role))',
  'INSERT'
)
ON CONFLICT (id) DO NOTHING;

-- Política para admins poderem atualizar/deletar
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'content-images-admin-update',
  'content-images',
  'Admins can update content images',
  '(EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''::app_role))',
  '(EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''::app_role))',
  'UPDATE'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command)
VALUES (
  'content-images-admin-delete',
  'content-images',
  'Admins can delete content images',
  '(EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''::app_role))',
  NULL,
  'DELETE'
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se o bucket foi criado corretamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name = 'content-images';

-- Verificar políticas criadas
SELECT 
  id,
  bucket_id,
  name,
  command,
  definition
FROM storage.policies 
WHERE bucket_id = 'content-images';