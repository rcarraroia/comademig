-- Script para criar sistema de gerenciamento de conteúdo

-- 1. Criar tabela de gerenciamento de conteúdo
CREATE TABLE IF NOT EXISTS public.content_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.content_management ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_management;
DROP POLICY IF EXISTS "Public can read content" ON public.content_management;

-- 4. Criar políticas RLS
CREATE POLICY "Admins can manage content" ON public.content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Public can read content" ON public.content_management
FOR SELECT TO anon, authenticated
USING (true);

-- 5. Inserir dados iniciais das páginas
INSERT INTO public.content_management (page_name, content_json) VALUES
('home', '{"title": "Início", "description": "Página inicial do site"}'),
('about', '{"title": "Sobre", "description": "Informações sobre a COMADEMIG"}'),
('leadership', '{"title": "Liderança", "description": "Nossa liderança"}'),
('news', '{"title": "Notícias", "description": "Últimas notícias"}'),
('events', '{"title": "Eventos", "description": "Eventos da COMADEMIG"}'),
('multimedia', '{"title": "Multimídia", "description": "Conteúdo multimídia"}'),
('contact', '{"title": "Contato", "description": "Entre em contato conosco"}')
ON CONFLICT (page_name) DO NOTHING;

-- 6. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = now();
  NEW.last_updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger
DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
CREATE TRIGGER update_content_management_timestamp
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_content_timestamp();

-- 8. Verificar resultado
SELECT 
  'Sistema de conteúdo criado' as resultado,
  (SELECT COUNT(*) FROM content_management) as total_pages;