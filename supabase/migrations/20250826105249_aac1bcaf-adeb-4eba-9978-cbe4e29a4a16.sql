
-- Restabelecer credenciais de administrador
SELECT make_user_admin('rcarrarocoach@gmail.com');

-- Criar a tabela para gerenciamento de conteúdo
CREATE TABLE public.content_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name text NOT NULL UNIQUE,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.content_management ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança - apenas admins podem gerenciar conteúdo
CREATE POLICY "Admins can manage content" 
  ON public.content_management 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  );

-- Inserir os registros iniciais para as páginas públicas
INSERT INTO public.content_management (page_name, content_json) VALUES
  ('home', '{}'::jsonb),
  ('sobre', '{}'::jsonb),
  ('lideranca', '{}'::jsonb),
  ('noticias', '{}'::jsonb),
  ('eventos', '{}'::jsonb),
  ('multimidia', '{}'::jsonb),
  ('contato', '{}'::jsonb);

-- Criar trigger para atualizar o campo last_updated_at
CREATE TRIGGER update_content_management_updated_at
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
