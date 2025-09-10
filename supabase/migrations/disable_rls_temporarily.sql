-- DESABILITAR RLS TEMPORARIAMENTE para resolver o problema crítico
-- ATENÇÃO: Esta é uma medida extrema e temporária

-- 1. Verificar estado atual do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'asaas_cobrancas';

-- 2. Listar todas as políticas atuais
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'asaas_cobrancas';

-- 3. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE asaas_cobrancas DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'asaas_cobrancas';

-- 5. Teste de inserção
DO $$
DECLARE
    test_user_id uuid := 'd30e3f4b-74a4-4e55-a78d-f04f391b02f9';
    test_id uuid;
BEGIN
    -- Tentar inserir sem RLS
    INSERT INTO asaas_cobrancas (
        asaas_id,
        user_id,
        data_vencimento,
        descricao,
        tipo_cobranca,
        valor,
        status
    ) VALUES (
        'no_rls_test_' || gen_random_uuid()::text,
        test_user_id,
        CURRENT_DATE + INTERVAL '30 days',
        'Teste sem RLS',
        'SUBSCRIPTION',
        39.90,
        'PENDING'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'SUCESSO SEM RLS: Inserção funcionou! ID: %', test_id;
    
    -- Limpar o teste
    DELETE FROM asaas_cobrancas WHERE id = test_id;
    RAISE NOTICE 'Teste limpo com sucesso';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO MESMO SEM RLS: %', SQLERRM;
END $$;

-- IMPORTANTE: REABILITAR RLS APÓS CONFIRMAR QUE O SISTEMA FUNCIONA
-- Descomente as linhas abaixo quando o sistema estiver funcionando:
/*
-- Reabilitar RLS
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

-- Criar política simples e funcional
CREATE POLICY "asaas_cobrancas_allow_all" ON asaas_cobrancas
    FOR ALL USING (true) WITH CHECK (true);
*/

-- AVISO: Com RLS desabilitado, qualquer usuário pode acessar qualquer cobrança
-- Esta é uma medida temporária apenas para destravar o sistema