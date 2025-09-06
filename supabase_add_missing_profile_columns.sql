-- ADICIONAR COLUNAS FALTANTES NA TABELA profiles
-- Data: 06/09/2025
-- Objetivo: Adicionar colunas show_contact e show_ministry para controle de privacidade do perfil público

-- Adicionar coluna show_contact (controla se mostra informações de contato no perfil público)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_contact BOOLEAN DEFAULT false;

-- Adicionar coluna show_ministry (controla se mostra informações ministeriais no perfil público)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_ministry BOOLEAN DEFAULT true;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.profiles.show_contact IS 'Controla se as informações de contato (telefone, email) são exibidas no perfil público';
COMMENT ON COLUMN public.profiles.show_ministry IS 'Controla se as informações ministeriais (igreja, data de ordenação) são exibidas no perfil público';

-- Verificar se as colunas foram criadas com sucesso
DO $$
DECLARE
    show_contact_exists BOOLEAN;
    show_ministry_exists BOOLEAN;
BEGIN
    -- Verificar show_contact
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'show_contact'
        AND table_schema = 'public'
    ) INTO show_contact_exists;
    
    -- Verificar show_ministry
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'show_ministry'
        AND table_schema = 'public'
    ) INTO show_ministry_exists;
    
    -- Relatório
    IF show_contact_exists AND show_ministry_exists THEN
        RAISE NOTICE 'SUCESSO: Ambas as colunas foram criadas com sucesso';
        RAISE NOTICE 'show_contact: % | show_ministry: %', 
            CASE WHEN show_contact_exists THEN 'EXISTS' ELSE 'MISSING' END,
            CASE WHEN show_ministry_exists THEN 'EXISTS' ELSE 'MISSING' END;
    ELSE
        RAISE WARNING 'ERRO: Algumas colunas não foram criadas';
        RAISE WARNING 'show_contact: % | show_ministry: %', 
            CASE WHEN show_contact_exists THEN 'EXISTS' ELSE 'MISSING' END,
            CASE WHEN show_ministry_exists THEN 'EXISTS' ELSE 'MISSING' END;
    END IF;
END $$;