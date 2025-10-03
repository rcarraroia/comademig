-- Script para criar Edge Function via SQL no painel do Supabase
-- Execute este script no Editor SQL do Supabase

-- IMPORTANTE: Este método cria a function como stored procedure PostgreSQL
-- Para Edge Functions JavaScript/TypeScript, use o painel de Edge Functions

-- 1. Criar função PostgreSQL que simula a Edge Function
CREATE OR REPLACE FUNCTION create_unified_member_type(
    member_name TEXT,
    member_description TEXT DEFAULT '',
    member_sort_order INTEGER DEFAULT 0,
    plan_title TEXT,
    plan_description TEXT DEFAULT '',
    plan_price DECIMAL(10,2),
    plan_recurrence TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_member_type_id UUID;
    new_subscription_plan_id UUID;
    result JSON;
BEGIN
    -- Validações
    IF member_name IS NULL OR LENGTH(TRIM(member_name)) = 0 THEN
        RAISE EXCEPTION 'Nome do tipo de membro é obrigatório';
    END IF;
    
    IF plan_title IS NULL OR LENGTH(TRIM(plan_title)) = 0 THEN
        RAISE EXCEPTION 'Título do plano é obrigatório';
    END IF;
    
    IF plan_price < 25.00 THEN
        RAISE EXCEPTION 'Preço mínimo é R$ 25,00';
    END IF;
    
    IF plan_recurrence NOT IN ('Mensal', 'Anual') THEN
        RAISE EXCEPTION 'Recorrência deve ser Mensal ou Anual';
    END IF;
    
    -- Verificar unicidade
    IF EXISTS (SELECT 1 FROM member_types WHERE name = member_name) THEN
        RAISE EXCEPTION 'Já existe um tipo de membro com o nome "%"', member_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM subscription_plans WHERE plan_title = plan_title) THEN
        RAISE EXCEPTION 'Já existe um plano com o título "%"', plan_title;
    END IF;
    
    -- Iniciar transação
    BEGIN
        -- 1. Criar tipo de membro
        INSERT INTO member_types (name, description, sort_order, is_active)
        VALUES (member_name, member_description, member_sort_order, true)
        RETURNING id INTO new_member_type_id;
        
        -- 2. Criar plano de assinatura
        INSERT INTO subscription_plans (plan_title, description, price, recurrence, is_active)
        VALUES (plan_title, plan_description, plan_price, plan_recurrence, true)
        RETURNING id INTO new_subscription_plan_id;
        
        -- 3. Criar relacionamento
        INSERT INTO member_type_subscriptions (member_type_id, subscription_plan_id)
        VALUES (new_member_type_id, new_subscription_plan_id);
        
        -- Retornar resultado
        result := json_build_object(
            'success', true,
            'data', json_build_object(
                'memberTypeId', new_member_type_id,
                'subscriptionPlanId', new_subscription_plan_id
            )
        );
        
        RETURN result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback automático em caso de erro
        RAISE EXCEPTION 'Erro ao criar tipo de membro unificado: %', SQLERRM;
    END;
END;
$$;

-- 2. Criar função wrapper para chamada via RPC
CREATE OR REPLACE FUNCTION rpc_create_unified_member_type(
    member_type JSONB,
    subscription_plan JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN create_unified_member_type(
        (member_type->>'name')::TEXT,
        (member_type->>'description')::TEXT,
        COALESCE((member_type->>'sort_order')::INTEGER, 0),
        (subscription_plan->>'plan_title')::TEXT,
        (subscription_plan->>'description')::TEXT,
        (subscription_plan->>'price')::DECIMAL(10,2),
        (subscription_plan->>'recurrence')::TEXT
    );
END;
$$;

-- 3. Testar a função
SELECT rpc_create_unified_member_type(
    '{"name": "Teste Função", "description": "Teste da função SQL", "sort_order": 99}',
    '{"plan_title": "Plano Teste Função", "description": "Teste", "price": 50.00, "recurrence": "Anual"}'
);

-- 4. Limpar teste (remover dados de teste)
DELETE FROM member_type_subscriptions 
WHERE member_type_id IN (
    SELECT id FROM member_types WHERE name = 'Teste Função'
);

DELETE FROM member_types WHERE name = 'Teste Função';
DELETE FROM subscription_plans WHERE plan_title = 'Plano Teste Função';

-- 5. Verificar se a função está disponível
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%unified_member_type%';