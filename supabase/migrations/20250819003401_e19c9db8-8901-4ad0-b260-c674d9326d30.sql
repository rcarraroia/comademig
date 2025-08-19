
-- Migration: Complete database schema and security setup
-- This migration creates the complete database structure for the COMADEMIG project

-- 1. Create triggers for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, status, tipo_membro)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'pendente',
    'membro'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Add updated_at triggers to all relevant tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.inscricoes_eventos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.suporte
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.noticias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.multimidia
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.certidoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('documentos', 'documentos', false),
  ('comprovantes', 'comprovantes', false),
  ('eventos', 'eventos', true),
  ('noticias', 'noticias', true),
  ('multimidia', 'multimidia', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Create storage policies
-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documentos bucket policies (private)
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Comprovantes bucket policies (private)
CREATE POLICY "Users can view their own receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comprovantes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comprovantes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public buckets policies (eventos, noticias, multimidia)
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'eventos');

CREATE POLICY "News images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'noticias');

CREATE POLICY "Media files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'multimidia');

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_membro ON public.profiles(tipo_membro);
CREATE INDEX IF NOT EXISTS idx_profiles_cargo ON public.profiles(cargo);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON public.eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_user_id ON public.inscricoes_eventos(user_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_eventos_evento_id ON public.inscricoes_eventos(evento_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_user_id ON public.financeiro(user_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON public.financeiro(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON public.mensagens(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_suporte_user_id ON public.suporte(user_id);
CREATE INDEX IF NOT EXISTS idx_suporte_status ON public.suporte(status);

-- 7. Create user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderador', 'tesoureiro', 'membro');

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 8. Additional security constraints
-- Add check constraints for data validation
ALTER TABLE public.profiles ADD CONSTRAINT check_cpf_format 
  CHECK (cpf IS NULL OR cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$');

ALTER TABLE public.profiles ADD CONSTRAINT check_status_values 
  CHECK (status IN ('pendente', 'ativo', 'suspenso', 'inativo'));

ALTER TABLE public.profiles ADD CONSTRAINT check_tipo_membro_values 
  CHECK (tipo_membro IN ('membro', 'pastor', 'pastora', 'moderador', 'admin', 'visitante'));

ALTER TABLE public.eventos ADD CONSTRAINT check_data_valida 
  CHECK (data_fim >= data_inicio);

ALTER TABLE public.financeiro ADD CONSTRAINT check_valor_positivo 
  CHECK (valor > 0);

-- 9. Create admin user function (to be called manually when needed)
CREATE OR REPLACE FUNCTION public.make_user_admin(_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _user_email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Update profile type
  UPDATE public.profiles 
  SET tipo_membro = 'admin', status = 'ativo'
  WHERE id = _user_id;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
