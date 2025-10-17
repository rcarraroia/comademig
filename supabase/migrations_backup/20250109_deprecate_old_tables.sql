-- ============================================================================
-- MIGRATION: Marcar tabelas antigas como deprecated
-- Data: 2025-01-09
-- Descrição: Adicionar comentários de depreciação nas tabelas antigas
-- ============================================================================

-- 1. Marcar valores_certidoes como deprecated
COMMENT ON TABLE valores_certidoes IS 
'⚠️ DEPRECATED: Esta tabela foi substituída pela tabela "servicos" (categoria: certidao). '
'Não adicionar novos registros. Será removida após validação completa do novo sistema. '
'Data de depreciação: 2025-01-09';

-- 2. Marcar certidoes como deprecated
COMMENT ON TABLE certidoes IS 
'⚠️ DEPRECATED: Esta tabela não é mais utilizada. Foi substituída pela tabela "servicos". '
'Pode ser removida com segurança. Data de depreciação: 2025-01-09';

-- 3. Marcar solicitacoes_certidoes como deprecated
COMMENT ON TABLE solicitacoes_certidoes IS 
'⚠️ DEPRECATED: Esta tabela foi substituída pela tabela "solicitacoes_servicos". '
'Não adicionar novos registros. Será removida após validação completa do novo sistema. '
'Data de depreciação: 2025-01-09';

-- 4. Marcar servicos_regularizacao como deprecated
COMMENT ON TABLE servicos_regularizacao IS 
'⚠️ DEPRECATED: Esta tabela foi substituída pela tabela "servicos" (categoria: regularizacao). '
'Não adicionar novos registros. Será removida após validação completa do novo sistema. '
'Data de depreciação: 2025-01-09';

-- 5. Marcar solicitacoes_regularizacao como deprecated
COMMENT ON TABLE solicitacoes_regularizacao IS 
'⚠️ DEPRECATED: Esta tabela foi substituída pela tabela "solicitacoes_servicos". '
'Não adicionar novos registros. Será removida após validação completa do novo sistema. '
'Data de depreciação: 2025-01-09';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Verificar comentários aplicados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_description d ON d.objoid = c.oid
  WHERE n.nspname = 'public'
    AND c.relname IN ('valores_certidoes', 'certidoes', 'solicitacoes_certidoes', 
                      'servicos_regularizacao', 'solicitacoes_regularizacao')
    AND d.description LIKE '%DEPRECATED%';
  
  RAISE NOTICE '✅ Tabelas marcadas como deprecated: %', v_count;
  
  IF v_count = 5 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as 5 tabelas antigas foram marcadas como deprecated';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Apenas % de 5 tabelas foram marcadas', v_count;
  END IF;
END $$;
