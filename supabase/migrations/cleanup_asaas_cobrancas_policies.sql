-- Limpeza e organização das políticas RLS para asaas_cobrancas
-- Remove políticas duplicadas e mantém apenas as necessárias

-- 1. Remover TODAS as políticas existentes para começar limpo
DROP POLICY IF EXISTS "Allow service_role insert for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Allow service_role select for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Allow service_role update for filiacao" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Only service role can delete cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Sistema pode atualizar cobranças" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Sistema pode inserir cobranças" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can insert their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can update their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can view their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias cobranças" ON asaas_cobrancas;

-- 2. Criar apenas as políticas essenciais e bem definidas

-- Política para SELECT: usuários veem suas cobranças, service_role vê tudo
CREATE POLICY "asaas_cobrancas_select_policy" ON asaas_cobrancas
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Política para INSERT: permite inserção por usuários autenticados e service_role
CREATE POLICY "asaas_cobrancas_insert_policy" ON asaas_cobrancas
    FOR INSERT WITH CHECK (
        -- Usuário pode inserir para si mesmo
        auth.uid() = user_id OR 
        -- Service role pode inserir para qualquer usuário (Edge Functions)
        auth.jwt() ->> 'role' = 'service_role' OR
        -- Fallback para Edge Functions
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' OR
        -- Permite inserção quando não há usuário autenticado (para Edge Functions)
        auth.uid() IS NULL
    );

-- Política para UPDATE: usuários podem atualizar suas cobranças, service_role qualquer uma
CREATE POLICY "asaas_cobrancas_update_policy" ON asaas_cobrancas
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

-- Política para DELETE: apenas service_role
CREATE POLICY "asaas_cobrancas_delete_policy" ON asaas_cobrancas
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

-- 3. Garantir que RLS está habilitado
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

-- 4. Verificar as políticas finais
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE tablename = 'asaas_cobrancas'
ORDER BY cmd, policyname;

-- 5. Teste de inserção para validar
-- Este comando deve funcionar quando executado por uma Edge Function
/*
INSERT INTO asaas_cobrancas (
    asaas_id,
    user_id,
    data_vencimento,
    descricao,
    tipo_cobranca,
    valor,
    status
) VALUES (
    'test_cleanup_' || gen_random_uuid()::text,
    'd30e3f4b-74a4-4e55-a78d-f04f391b02f9', -- user_id real do sistema
    CURRENT_DATE + INTERVAL '30 days',
    'Teste após limpeza de políticas',
    'SUBSCRIPTION',
    100.00,
    'PENDING'
);
*/