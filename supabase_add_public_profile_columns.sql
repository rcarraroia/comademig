-- ADICIONAR COLUNAS PARA PERFIL PÚBLICO
-- Execute no painel do Supabase

-- Adicionar colunas para configurações de privacidade do perfil público
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_contact BOOLEAN DEFAULT false;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_ministry BOOLEAN DEFAULT false;

-- Verificar se a coluna bio já existe, se não, criar
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adicionar comentários
COMMENT ON COLUMN public.profiles.show_contact IS 'Se deve mostrar informações de contato no perfil público';
COMMENT ON COLUMN public.profiles.show_ministry IS 'Se deve mostrar informações ministeriais no perfil público';
COMMENT ON COLUMN public.profiles.bio IS 'Biografia do usuário para perfil público';

-- Verificação
DO $$
BEGIN
    RAISE NOTICE 'Colunas do perfil público configuradas com sucesso';
END $$;