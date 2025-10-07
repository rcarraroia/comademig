-- =====================================================
-- MIGRAÇÃO 001: Correção Schema Cargos e Planos
-- Data: 06/10/2025
-- Descrição: Corrige relacionamento para permitir múltiplas periodicidades
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- =====================================================

-- PASSO 1: Verificar estrutura atual da subscription_plans
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 2: Adicionar coluna member_type_id se não existir
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS member_type_id UUID REFERENCES member_types(id) ON DELETE CASCADE;

-- PASSO 3: Adicionar coluna duration_months se não existir (sem NOT NULL inicialmente)
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;

-- PASSO 3.1: Atualizar valores NULL para 1 (mensal como padrão)
UPDATE subscription_plans 
SET duration_months = 1 
WHERE duration_months IS NULL;

-- PASSO 3.2: Agora adicionar NOT NULL constraint
ALTER TABLE subscription_plans 
ALTER COLUMN duration_months SET NOT NULL;

-- PASSO 4: Adicionar campos necessários se não existirem
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- PASSO 5: Adicionar constraint para evitar duplicação de periodicidade
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_member_type_duration'
        AND table_name = 'subscription_plans'
    ) THEN
        ALTER TABLE subscription_plans
        ADD CONSTRAINT unique_member_type_duration 
        UNIQUE (member_type_id, duration_months);
    END IF;
END $$;

-- PASSO 6: Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_member_type_id 
ON subscription_plans(member_type_id);

-- PASSO 6.1: Limpar dados inconsistentes da migração anterior
-- Remove planos que não têm member_type_id (da migração anterior)
DELETE FROM subscription_plans WHERE member_type_id IS NULL;

-- PASSO 7: Popular com planos padrão para cada cargo existente
-- NOTA: recurrence sempre 'monthly' devido ao constraint, diferenciação por duration_months
-- Planos MENSAIS (1 mês)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Mensal',
    CASE mt.name
        WHEN 'Bispo' THEN 10.00
        WHEN 'Pastor' THEN 15.00
        WHEN 'Diácono' THEN 8.00
        WHEN 'Membro' THEN 5.00
        WHEN 'Evangelista' THEN 12.00
        WHEN 'Administrador' THEN 0.00
        ELSE 10.00
    END,
    'monthly', -- recurrence (sempre monthly, diferenciação por duration_months)
    1, -- duration_months
    true,
    1,
    '{"certidoes": 5, "suporte": "email", "carteira_digital": true}'
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 1
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 8: Adicionar planos SEMESTRAIS (6 meses)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Semestral',
    CASE mt.name
        WHEN 'Bispo' THEN 55.00
        WHEN 'Pastor' THEN 85.00
        WHEN 'Diácono' THEN 45.00
        WHEN 'Membro' THEN 28.00
        WHEN 'Evangelista' THEN 68.00
        WHEN 'Administrador' THEN 0.00
        ELSE 55.00
    END,
    'monthly', -- recurrence (sempre monthly, diferenciação por duration_months)
    6, -- duration_months
    true,
    2,
    '{"certidoes": "unlimited", "suporte": "priority", "carteira_digital": true, "desconto": "8%"}'
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 6
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 9: Adicionar planos ANUAIS (12 meses)
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    recurrence,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Anual',
    CASE mt.name
        WHEN 'Bispo' THEN 100.00
        WHEN 'Pastor' THEN 150.00
        WHEN 'Diácono' THEN 80.00
        WHEN 'Membro' THEN 50.00
        WHEN 'Evangelista' THEN 120.00
        WHEN 'Administrador' THEN 0.00
        ELSE 100.00
    END,
    'monthly', -- recurrence (sempre monthly, diferenciação por duration_months)
    12, -- duration_months
    true,
    3,
    '{"certidoes": "unlimited", "suporte": "phone", "carteira_digital": true, "desconto": "17%"}'
FROM member_types mt
WHERE mt.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 12
)
ON CONFLICT (member_type_id, duration_months) DO NOTHING;

-- PASSO 10: Corrigir TODOS os registros órfãos em user_subscriptions
-- Identificar e corrigir registros com subscription_plan_id inválido
UPDATE user_subscriptions
SET subscription_plan_id = (
    SELECT sp.id 
    FROM subscription_plans sp 
    WHERE sp.member_type_id = user_subscriptions.member_type_id 
    AND sp.duration_months = 1 
    LIMIT 1
)
WHERE subscription_plan_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.id = user_subscriptions.subscription_plan_id
)
AND EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = user_subscriptions.member_type_id 
    AND sp.duration_months = 1
);

-- PASSO 10.1: Corrigir registros com subscription_plan_id NULL mas com member_type_id válido
UPDATE user_subscriptions
SET subscription_plan_id = (
    SELECT sp.id 
    FROM subscription_plans sp 
    WHERE sp.member_type_id = user_subscriptions.member_type_id 
    AND sp.duration_months = 1 
    LIMIT 1
)
WHERE subscription_plan_id IS NULL
AND member_type_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = user_subscriptions.member_type_id 
    AND sp.duration_months = 1
);

-- PASSO 11: Criar função para auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASSO 12: Criar trigger para subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 13: Habilitar RLS se não estiver habilitado
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- PASSO 14: Criar políticas RLS para subscription_plans
-- NOTA: tabela profiles usa 'cargo' e 'tipo_membro' ao invés de 'role'
-- Política para leitura pública (todos podem ver planos ativos)
DROP POLICY IF EXISTS "Planos públicos para leitura" ON subscription_plans;
CREATE POLICY "Planos públicos para leitura" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Política para admins gerenciarem planos
DROP POLICY IF EXISTS "Admins gerenciam planos" ON subscription_plans;
CREATE POLICY "Admins gerenciam planos" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

-- PASSO 15: Verificar correção de registros órfãos
SELECT 
    'user_subscriptions_corrigidos' as status,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE subscription_plan_id IS NOT NULL) as com_plano_valido,
    COUNT(*) FILTER (WHERE subscription_plan_id IS NULL) as ainda_orfaos
FROM user_subscriptions;

-- PASSO 16: Verificar resultado final
SELECT 
    mt.name as cargo,
    sp.name as plano,
    sp.price,
    sp.duration_months,
    sp.is_active,
    sp.features
FROM member_types mt
LEFT JOIN subscription_plans sp ON mt.id = sp.member_type_id
WHERE mt.is_active = true
ORDER BY mt.sort_order, sp.duration_months;

-- PASSO 17: Verificar contagem final
SELECT 
    'member_types' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM member_types
UNION ALL
SELECT 
    'subscription_plans' as tabela,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM subscription_plans;

-- =====================================================
-- FIM DA MIGRAÇÃO 001
-- =====================================================