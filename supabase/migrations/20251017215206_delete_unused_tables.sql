-- ============================================
-- DELETAR TABELAS VAZIAS NÃO UTILIZADAS
-- ============================================
-- Data: 2025-10-17
-- Objetivo: Remover 3 tabelas vazias antes da implementação do sistema de gerenciamento de conteúdo
-- 
-- APROVAÇÃO DO USUÁRIO:
-- ✅ Deletar: noticias (vazia, será recriada com schema correto)
-- ✅ Deletar: multimidia (vazia, não será mais usada)
-- ✅ Deletar: eventos (vazia, fora do escopo atual)
-- 
-- TABELAS MANTIDAS:
-- ❌ profiles (usada pelo sistema de autenticação)
-- ❌ transactions (usada pelo sistema de pagamentos)
-- ============================================

-- Deletar tabelas vazias aprovadas
DROP TABLE IF EXISTS noticias CASCADE;
DROP TABLE IF EXISTS multimidia CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- As tabelas foram removidas com sucesso
-- Próximas migrações criarão:
-- - noticias (com schema correto)
-- - videos (novo)
-- - albuns_fotos (novo)
-- - fotos (novo)
-- ============================================
