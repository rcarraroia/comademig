-- ============================================================================
-- POLÍTICAS RLS PARA SISTEMA DE FILIAÇÃO - COMADEMIG
-- ============================================================================
-- Data: 2025-01-10
-- Objetivo: Garantir que usuários possam ler tipos/planos e criar assinaturas
-- ============================================================================

-- ============================================================================
-- PASSO 1: VERIFICAR POLÍTICAS EXISTENTES
-- ============================================================================

SELECT 
    'DIAGNÓSTICO: Políticas RLS Atuais' as etapa,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions',
    'user_subscriptions',
    'profiles'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- PASSO 2: HABILITAR RLS NAS TABELAS (se não estiver habilitado)
-- ============================================================================

ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_type_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

SELECT 'RLS HABILITADO em todas as tabelas' as resultado;

-- ============================================================================
-- PASSO 3: POLÍTICAS PARA LEITURA PÚBLICA (member_types)
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Anyone can read active member types" ON member_types;
DROP POLICY IF EXISTS "Public can read active member types" ON member_types;
DROP POLICY IF EXISTS "Enable read access for all users" ON member_types;

-- Criar política: Qualquer um pode ler tipos ativos
CREATE POLICY "Anyone can read active member types"
ON member_types
FOR SELECT
TO public
USING (is_active = true);

SELECT 'Política criada: member_types (leitura pública)' as resultado;

-- ============================================================================
-- PASSO 4: POLÍTICAS PARA LEITURA PÚBLICA (subscription_plans)
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Anyone can read active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Public can read active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Enable read access for all users" ON subscription_plans;

-- Criar política: Qualquer um pode ler planos ativos
CREATE POLICY "Anyone can read active subscription plans"
ON subscription_plans
FOR SELECT
TO public
USING (is_active = true);

SELECT 'Política criada: subscription_plans (leitura pública)' as resultado;

-- ============================================================================
-- PASSO 5: POLÍTICAS PARA LEITURA PÚBLICA (member_type_subscriptions)
-- ============================================================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Anyone can read member type subscriptions" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Public can read relationships" ON member_type_subscriptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON member_type_subscriptions;

-- Criar política: Qualquer um pode ler relacionamentos
CREATE POLICY "Anyone can read member type subscriptions"
ON member_type_subscriptions
FOR SELECT
TO public
USING (true);

SELECT 'Política criada: member_type_subscriptions (leitura pública)' as resultado;

-- ============================================================================
-- PASSO 6: POLÍTICAS PARA PROFILES
-- ============================================================================

-- 6.1 Leitura: Usuários podem ler seu próprio perfil
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

SELECT 'Política criada: profiles (leitura própria)' as resultado;

-- 6.2 Atualização: Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can modify own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

SELECT 'Política criada: profiles (atualização própria)' as resultado;

-- 6.3 Inserção: Sistema pode criar perfis (via trigger)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for service role only" ON profiles;

CREATE POLICY "Service role can insert profiles"
ON profiles
FOR INSERT
TO service_role
WITH CHECK (true);

SELECT 'Política criada: profiles (inserção via service role)' as resultado;

-- ============================================================================
-- PASSO 7: POLÍTICAS PARA USER_SUBSCRIPTIONS
-- ============================================================================

-- 7.1 Leitura: Usuários podem ler suas próprias assinaturas
DROP POLICY IF EXISTS "Users can read own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_subscriptions;

CREATE POLICY "Users can read own subscriptions"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

SELECT 'Política criada: user_subscriptions (leitura própria)' as resultado;

-- 7.2 Inserção: Usuários podem criar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can create own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_subscriptions;

CREATE POLICY "Users can create own subscriptions"
ON user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

SELECT 'Política criada: user_subscriptions (inserção própria)' as resultado;

-- 7.3 Atualização: Usuários podem atualizar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can modify own subscriptions" ON user_subscriptions;

CREATE POLICY "Users can update own subscriptions"
ON user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

SELECT 'Política criada: user_subscriptions (atualização própria)' as resultado;

-- ============================================================================
-- PASSO 8: POLÍTICAS PARA ADMINS (todas as tabelas)
-- ============================================================================

-- 8.1 Admins podem fazer tudo em member_types
DROP POLICY IF EXISTS "Admins can manage member types" ON member_types;

CREATE POLICY "Admins can manage member types"
ON member_types
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
);

SELECT 'Política criada: member_types (admins)' as resultado;

-- 8.2 Admins podem fazer tudo em subscription_plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;

CREATE POLICY "Admins can manage subscription plans"
ON subscription_plans
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
);

SELECT 'Política criada: subscription_plans (admins)' as resultado;

-- 8.3 Admins podem fazer tudo em member_type_subscriptions
DROP POLICY IF EXISTS "Admins can manage member type subscriptions" ON member_type_subscriptions;

CREATE POLICY "Admins can manage member type subscriptions"
ON member_type_subscriptions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
);

SELECT 'Política criada: member_type_subscriptions (admins)' as resultado;

-- 8.4 Admins podem ver todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;

CREATE POLICY "Admins can view all subscriptions"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
);

SELECT 'Política criada: user_subscriptions (admins leitura)' as resultado;

-- 8.5 Admins podem ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.tipo_membro IN ('admin', 'super_admin')
    )
);

SELECT 'Política criada: profiles (admins leitura)' as resultado;

-- ============================================================================
-- PASSO 9: VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 
    'VERIFICAÇÃO FINAL: Políticas Criadas' as etapa,
    tablename,
    COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions',
    'user_subscriptions',
    'profiles'
)
GROUP BY tablename
ORDER BY tablename;

-- Listar todas as políticas criadas
SELECT 
    'LISTA COMPLETA DE POLÍTICAS' as etapa,
    tablename,
    policyname,
    cmd as operacao,
    CASE 
        WHEN roles::text LIKE '%public%' THEN 'Público'
        WHEN roles::text LIKE '%authenticated%' THEN 'Autenticado'
        WHEN roles::text LIKE '%service_role%' THEN 'Service Role'
        ELSE roles::text
    END as acesso
FROM pg_policies
WHERE tablename IN (
    'member_types',
    'subscription_plans',
    'member_type_subscriptions',
    'user_subscriptions',
    'profiles'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Após executar este script, você deve ter:
--
-- member_types:
--   ✅ Leitura pública (tipos ativos)
--   ✅ Admins podem gerenciar
--
-- subscription_plans:
--   ✅ Leitura pública (planos ativos)
--   ✅ Admins podem gerenciar
--
-- member_type_subscriptions:
--   ✅ Leitura pública
--   ✅ Admins podem gerenciar
--
-- profiles:
--   ✅ Usuários leem/atualizam próprio perfil
--   ✅ Service role pode inserir
--   ✅ Admins podem ver todos
--
-- user_subscriptions:
--   ✅ Usuários leem/criam/atualizam próprias assinaturas
--   ✅ Admins podem ver todas
--
-- ============================================================================

-- ============================================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- ============================================================================
-- 1. Execute PRIMEIRO o script: fix_filiacao_system.sql
-- 2. Depois execute ESTE script
-- 3. Verifique os resultados das queries de verificação
-- 4. Teste no frontend: https://comademig.vercel.app/filiacao
-- ============================================================================
