-- ⚠️ MIGRAÇÃO DESABILITADA - CONFLITO COM MIGRAÇÃO 001
-- 
-- Esta migração foi desabilitada porque:
-- 1. Fazia TRUNCATE que apagava dados da migração 001_fix_member_types_subscription_plans.sql
-- 2. Criava planos genéricos sem relacionamento com member_types
-- 3. Quebrava a estrutura 1:N implementada na migração 001
--
-- A migração 001 já cria os planos corretamente com:
-- - Relacionamento member_type_id
-- - Planos mensais, semestrais e anuais
-- - Preços diferenciados por cargo
-- - Estrutura completa de features
--
-- Se precisar recriar planos, use a migração 001 como referência.

-- NENHUMA OPERAÇÃO SERÁ EXECUTADA
SELECT 'Migração desabilitada - usar migração 001 para planos de assinatura' as status;