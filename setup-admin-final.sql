-- Script para configurar admin e sistema de gerenciamento de conteúdo
-- Usuário: rcarrarocoach@gmail.com
-- UUID: c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a

-- 1. Configurar usuário como admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Atualizar perfil do usuário
INSERT INTO public.profiles (id, nome_completo, email, status)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',
  'Renato Magno Carraro Alves',
  'rcarrarocoach@gmail.com',
  'ativo'
)
ON CONFLICT (id) DO UPDATE SET
  nome_completo = EXCLUDED.nome_completo,
  email = EXCLUDED.email,
  status = 'ativo';

-- 3. Criar tabela de gerenciamento de conteúdo (se não existir)
CREATE TABLE IF NOT EXISTS public.content_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE public.content_management ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS (removendo existentes primeiro)
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_management;
CREATE POLICY "Admins can manage content" ON public.content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

DROP POLICY IF EXISTS "Public can read content" ON public.content_management;
CREATE POLICY "Public can read content" ON public.content_management
FOR SELECT TO anon, authenticated
USING (true);

-- 6. Inserir dados iniciais das páginas
INSERT INTO public.content_management (page_name, content_json) VALUES
('home', '{"title": "Início", "description": "Página inicial do site"}'),
('about', '{"title": "Sobre", "description": "Informações sobre a COMADEMIG"}'),
('leadership', '{"title": "Liderança", "description": "Nossa liderança"}'),
('news', '{"title": "Notícias", "description": "Últimas notícias"}'),
('events', '{"title": "Eventos", "description": "Eventos da COMADEMIG"}'),
('multimedia', '{"title": "Multimídia", "description": "Conteúdo multimídia"}'),
('contact', '{"title": "Contato", "description": "Entre em contato conosco"}')
ON CONFLICT (page_name) DO NOTHING;

-- 7. Criar função para atualizar timestamp (se não existir)
CREATE OR REPLACE FUNCTION update_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  NEW.last_updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
CREATE TRIGGER update_content_management_timestamp
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_content_timestamp();

-- 9. Verificar se tudo foi criado corretamente
SELECT 
  'Admin configurado' as status,
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a' 
    AND role = 'admin'::app_role
  ) as is_admin,
  (SELECT COUNT(*) FROM content_management) as pages_count;