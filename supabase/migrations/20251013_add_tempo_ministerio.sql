-- ============================================
-- MIGRAÇÃO: Adicionar campo tempo_ministerio
-- ============================================
-- Data: 2025-10-13
-- Objetivo: Separar "tempo de ministério" de "data de ordenação"
-- Impacto: Adiciona coluna TEXT para armazenar tempo livre (ex: "5 anos")
-- ============================================

-- Adicionar coluna tempo_ministerio na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tempo_ministerio TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN profiles.tempo_ministerio IS 'Tempo de ministério em formato livre (ex: "5 anos", "10 anos")';

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_profiles_tempo_ministerio 
ON profiles(tempo_ministerio) 
WHERE tempo_ministerio IS NOT NULL;

-- Log de auditoria
DO $$
BEGIN
  RAISE NOTICE 'Coluna tempo_ministerio adicionada à tabela profiles';
END $$;
