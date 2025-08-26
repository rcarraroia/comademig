-- Primeiro, vamos encontrar o user_id do email rcarrarocoach@gmail.com
-- e torná-lo admin

-- Inserir role de admin para o usuário (substitua o UUID pelo ID real do usuário)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'rcarrarocoach@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar tabela para gerenciamento de conteúdo
CREATE TABLE IF NOT EXISTS public.content_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.content_management ENABLE ROW LEVEL SECURITY;

-- Policy para admins gerenciarem conteúdo
CREATE POLICY "Admins can manage content" ON public.content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Policy para leitura pública
CREATE POLICY "Public can read content" ON public.content_management
FOR SELECT TO anon, authenticated
USING (true);

-- Inserir registros iniciais
INSERT INTO public.content_management (page_name, content_json) VALUES
('home', '{"title": "Início", "description": "Página inicial do site"}'),
('about', '{"title": "Sobre", "description": "Informações sobre a COMADEMIG"}'),
('leadership', '{"title": "Liderança", "description": "Nossa liderança"}'),
('news', '{"title": "Notícias", "description": "Últimas notícias"}'),
('events', '{"title": "Eventos", "description": "Eventos da COMADEMIG"}'),
('multimedia', '{"title": "Multimídia", "description": "Conteúdo multimídia"}'),
('contact', '{"title": "Contato", "description": "Entre em contato conosco"}')
ON CONFLICT (page_name) DO NOTHING;