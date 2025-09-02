-- Adicionar coluna 'bio' à tabela profiles
-- Esta migração corrige o erro "Could not find the 'bio' column of 'profiles' in the schema cache"

-- Adicionar coluna bio se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.bio IS 'Biografia do usuário - campo opcional para descrição pessoal';