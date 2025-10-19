-- ============================================
-- LIMPEZA DE TABELAS NÃO UTILIZADAS
-- ============================================
-- Data: 2025-10-17
-- Objetivo: Remover 3 tabelas vazias antes da implementação
-- 
-- APROVAÇÃO DO USUÁRIO:
-- ✅ Deletar: noticias, multimidia, eventos
-- ❌ Manter: profiles, transactions (usadas pelo sistema)
-- ============================================

-- Deletar tabelas vazias aprovadas
DROP TABLE IF EXISTS noticias CASCADE;
DROP TABLE IF EXISTS multimidia CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
