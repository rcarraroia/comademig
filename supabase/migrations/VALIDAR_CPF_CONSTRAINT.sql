-- =====================================================
-- SCRIPT DE VALIDAÇÃO: Constraint de CPF
-- Execute APÓS a migração para validar
-- =====================================================

-- 1. Verificar se a constraint existe
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'check_cpf_format'
AND constraint_schema = 'public';

-- 2. Testar inserção com CPF sem formatação (deve funcionar)
DO $$
BEGIN
  -- Teste 1: CPF sem formatação
  BEGIN
    INSERT INTO public.profiles (
      id,
      nome_completo,
      cpf,
      tipo_membro
    ) VALUES (
      gen_random_uuid(),
      'Teste CPF Sem Formato',
      '12345678900',
      'membro'
    );
    RAISE NOTICE '✅ Teste 1 PASSOU: CPF sem formatação aceito';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Teste 1 FALHOU: %', SQLERRM;
    ROLLBACK;
  END;

  -- Teste 2: CPF com formatação
  BEGIN
    INSERT INTO public.profiles (
      id,
      nome_completo,
      cpf,
      tipo_membro
    ) VALUES (
      gen_random_uuid(),
      'Teste CPF Com Formato',
      '123.456.789-00',
      'membro'
    );
    RAISE NOTICE '✅ Teste 2 PASSOU: CPF com formatação aceito';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Teste 2 FALHOU: %', SQLERRM;
    ROLLBACK;
  END;

  -- Teste 3: CPF inválido (deve falhar)
  BEGIN
    INSERT INTO public.profiles (
      id,
      nome_completo,
      cpf,
      tipo_membro
    ) VALUES (
      gen_random_uuid(),
      'Teste CPF Invalido',
      'ABC123',
      'membro'
    );
    RAISE NOTICE '❌ Teste 3 FALHOU: CPF inválido foi aceito (não deveria)';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ Teste 3 PASSOU: CPF inválido rejeitado corretamente';
    ROLLBACK;
  END;
END $$;

-- =====================================================
-- RESULTADO ESPERADO:
-- ✅ Teste 1 PASSOU: CPF sem formatação aceito
-- ✅ Teste 2 PASSOU: CPF com formatação aceito
-- ✅ Teste 3 PASSOU: CPF inválido rejeitado
-- =====================================================
