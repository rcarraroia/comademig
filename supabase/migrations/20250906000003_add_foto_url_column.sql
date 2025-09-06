-- ADICIONAR COLUNA foto_url NA TABELA profiles
-- Data: 06/09/2025
-- Objetivo: Corrigir erro "Could not find the 'foto_url' column"

-- Adicionar coluna foto_url se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Adicionar comentário
COMMENT ON COLUMN public.profiles.foto_url IS 'URL da foto de perfil do usuário armazenada no bucket avatars';

-- Verificar se a coluna foi criada
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'foto_url'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Coluna foto_url criada com sucesso na tabela profiles';
    ELSE
        RAISE WARNING 'Falha ao criar coluna foto_url na tabela profiles';
    END IF;
END $$;