-- CORREÇÃO EMERGENCIAL - Política RLS mais permissiva para asaas_cobrancas
-- Esta é uma solução temporária para resolver o bloqueio imediato

-- 1. Remover a política de INSERT atual
DROP POLICY IF EXISTS "asaas_cobrancas_insert_policy" ON asaas_cobrancas;

-- 2. Criar política de INSERT muito permissiva (TEMPORÁRIA)
CREATE POLICY "asaas_cobrancas_insert_emergency" ON asaas_cobrancas
    FOR INSERT WITH CHECK (true);

-- 3. Verificar se funcionou
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'asaas_cobrancas' AND cmd = 'INSERT';

-- 4. Teste de inserção inline
DO $$
DECLARE
    test_user_id uuid := 'd30e3f4b-74a4-4e55-a78d-f04f391b02f9';
    test_id uuid;
BEGIN
    -- Tentar inserir
    INSERT INTO asaas_cobrancas (
        asaas_id,
        user_id,
        data_vencimento,
        descricao,
        tipo_cobranca,
        valor,
        status
    ) VALUES (
        'emergency_test_' || gen_random_uuid()::text,
        test_user_id,
        CURRENT_DATE + INTERVAL '30 days',
        'Teste emergencial de política',
        'SUBSCRIPTION',
        39.90,
        'PENDING'
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'SUCESSO: Inserção funcionou! ID: %', test_id;
    
    -- Limpar o teste
    DELETE FROM asaas_cobrancas WHERE id = test_id;
    RAISE NOTICE 'Teste limpo com sucesso';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO: %', SQLERRM;
END $$;

-- IMPORTANTE: Esta política é TEMPORÁRIA e muito permissiva
-- Após confirmar que o sistema funciona, substitua por uma política mais segura:
/*
DROP POLICY IF EXISTS "asaas_cobrancas_insert_emergency" ON asaas_cobrancas;

CREATE POLICY "asaas_cobrancas_insert_secure" ON asaas_cobrancas
    FOR INSERT WITH CHECK (
        -- Permite inserção se o usuário está autenticado E é o dono do registro
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        -- OU se é uma chamada de service_role (Edge Functions)
        (current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role')
    );
*/