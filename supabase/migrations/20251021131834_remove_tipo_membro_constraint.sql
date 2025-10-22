-- ============================================
-- CORREÇÃO: Remove constraint que bloqueia tipos dinâmicos
-- ============================================
-- Data: 2025-10-21
-- Problema: Constraint check_tipo_membro_values impede criação de tipos dinâmicos
-- Solução: Remover constraint para permitir qualquer tipo criado em member_types
-- Impacto: Positivo - Alinha banco com lógica de negócio
-- Risco: ZERO - Apenas remove restrição desnecessária
-- ============================================

-- Remove o constraint que limita tipo_membro a valores hardcoded
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS check_tipo_membro_values;

-- Comentário explicativo
COMMENT ON COLUMN profiles.tipo_membro IS 
'Tipo de membro (DEPRECATED - usar member_type_id). Aceita qualquer valor criado em member_types.';
