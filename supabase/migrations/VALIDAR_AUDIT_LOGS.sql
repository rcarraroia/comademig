-- =====================================================
-- SCRIPT DE VALIDAÇÃO: Tabela audit_logs
-- Execute este script APÓS a migração para validar
-- =====================================================

-- 1. Verificar se a tabela existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'audit_logs'
    ) 
    THEN '✅ Tabela audit_logs existe'
    ELSE '❌ Tabela audit_logs NÃO existe'
  END AS status_tabela;

-- 2. Verificar colunas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'audit_logs'
AND schemaname = 'public';

-- 4. Verificar RLS policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'audit_logs'
AND schemaname = 'public';

-- 5. Testar inserção (como teste)
INSERT INTO public.audit_logs (
  action,
  entity_type,
  entity_id,
  new_values
) VALUES (
  'test',
  'system',
  gen_random_uuid(),
  '{"test": true}'::jsonb
) RETURNING id, action, entity_type, created_at;

-- 6. Verificar se o registro foi inserido
SELECT COUNT(*) as total_logs FROM public.audit_logs;

-- 7. Limpar registro de teste
DELETE FROM public.audit_logs WHERE action = 'test';

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Tabela existe
-- ✅ 10 colunas listadas
-- ✅ 4 índices criados
-- ✅ 2 policies criadas
-- ✅ Inserção bem-sucedida
-- ✅ Contagem > 0
-- ✅ Limpeza bem-sucedida
-- =====================================================
