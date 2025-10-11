-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-11
-- Problema: Formulário de filiação falhando ao tentar salvar campos que não existem
-- Tabela: profiles (2 registros existentes)
-- Impacto: Adicionar 3 colunas (não destrutivo)
-- Verificações:
--   ✅ Tabela existe com dados
--   ✅ Nenhum dado será perdido
--   ✅ Colunas serão nullable (compatível com registros existentes)
--   ✅ Apenas adiciona, não modifica nada existente
-- ============================================

-- Adicionar coluna 'numero' (número do endereço)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS numero VARCHAR(20);

-- Adicionar coluna 'complemento' (complemento do endereço)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);

-- Adicionar coluna 'bairro' (bairro do endereço)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

-- Adicionar comentários explicativos
COMMENT ON COLUMN profiles.numero IS 'Número do endereço';
COMMENT ON COLUMN profiles.complemento IS 'Complemento do endereço (apto, bloco, etc)';
COMMENT ON COLUMN profiles.bairro IS 'Bairro do endereço';

-- Validação: Verificar que colunas foram criadas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'numero'
    ) THEN
        RAISE NOTICE '✅ Coluna numero adicionada em profiles';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'complemento'
    ) THEN
        RAISE NOTICE '✅ Coluna complemento adicionada em profiles';
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'bairro'
    ) THEN
        RAISE NOTICE '✅ Coluna bairro adicionada em profiles';
    END IF;
END $$;
