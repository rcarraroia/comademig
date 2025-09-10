-- Correção das políticas RLS para tabela asaas_cobrancas
-- Este script resolve o erro "new row violates row-level security policy"

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'asaas_cobrancas';

-- 2. Remover políticas restritivas existentes (se houver)
DROP POLICY IF EXISTS "Users can only access their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can only insert their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can only update their own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can only delete their own cobrancas" ON asaas_cobrancas;

-- 3. Criar políticas RLS adequadas para asaas_cobrancas

-- Política para SELECT: usuários podem ver apenas suas próprias cobranças
CREATE POLICY "Users can view their own cobrancas" ON asaas_cobrancas
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Política para INSERT: usuários podem inserir cobranças para si mesmos
-- Edge Functions podem inserir para qualquer usuário
CREATE POLICY "Users can insert their own cobrancas" ON asaas_cobrancas
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

-- Política para UPDATE: usuários podem atualizar apenas suas cobranças
-- Edge Functions podem atualizar qualquer cobrança
CREATE POLICY "Users can update their own cobrancas" ON asaas_cobrancas
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

-- Política para DELETE: apenas service_role pode deletar
CREATE POLICY "Only service role can delete cobrancas" ON asaas_cobrancas
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role'
    );

-- 4. Garantir que RLS está habilitado
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'asaas_cobrancas'
ORDER BY policyname;

-- 6. Teste de inserção (comentado - descomente para testar)
/*
-- Este INSERT deve funcionar quando executado por um usuário autenticado
INSERT INTO asaas_cobrancas (
    asaas_id,
    user_id,
    data_vencimento,
    descricao,
    tipo_cobranca,
    valor,
    status
) VALUES (
    'test_policy_' || gen_random_uuid()::text,
    auth.uid(),
    CURRENT_DATE + INTERVAL '30 days',
    'Teste de política RLS',
    'SUBSCRIPTION',
    100.00,
    'PENDING'
);
*/

-- Comentários sobre as políticas:
-- 1. SELECT: Usuários veem apenas suas cobranças, service_role vê tudo
-- 2. INSERT: Usuários podem criar cobranças para si, Edge Functions para qualquer usuário
-- 3. UPDATE: Usuários podem atualizar suas cobranças, Edge Functions qualquer uma
-- 4. DELETE: Apenas service_role pode deletar (segurança)

-- As Edge Functions do Supabase executam com service_role automaticamente,
-- então elas poderão inserir cobranças para qualquer usuário sem problemas.