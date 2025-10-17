-- Migração para constraints do sistema unificado de tipos de membro
-- Data: 2025-01-26
-- Descrição: Adiciona constraints de validação e índices de performance

-- 1. Constraints de unicidade
ALTER TABLE member_types 
ADD CONSTRAINT member_types_name_unique UNIQUE (name);

ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_title_unique UNIQUE (plan_title);

-- 2. Constraint de preço mínimo
ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_price_minimum 
CHECK (price >= 25.00);

-- 3. Constraint de recorrência
ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_recurrence_valid 
CHECK (recurrence IN ('Mensal', 'Anual'));

-- 4. Índices de performance para queries unificadas
CREATE INDEX IF NOT EXISTS idx_member_types_active_sorted 
ON member_types (is_active, sort_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active 
ON subscription_plans (is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_member_type_subscriptions_lookup 
ON member_type_subscriptions (member_type_id, subscription_plan_id);

-- 5. Índices para queries de desnormalização
CREATE INDEX IF NOT EXISTS idx_member_type_subscriptions_member_type 
ON member_type_subscriptions (member_type_id);

CREATE INDEX IF NOT EXISTS idx_member_type_subscriptions_plan 
ON member_type_subscriptions (subscription_plan_id);

-- 6. Comentários para documentação
COMMENT ON CONSTRAINT member_types_name_unique ON member_types 
IS 'Garante unicidade dos nomes de tipos de membro';

COMMENT ON CONSTRAINT subscription_plans_title_unique ON subscription_plans 
IS 'Garante unicidade dos títulos de planos de assinatura';

COMMENT ON CONSTRAINT subscription_plans_price_minimum ON subscription_plans 
IS 'Garante preço mínimo de R$ 25,00 para planos de assinatura';

COMMENT ON CONSTRAINT subscription_plans_recurrence_valid ON subscription_plans 
IS 'Garante que recorrência seja apenas Mensal ou Anual';

-- 7. Função para validar dados antes de inserção
CREATE OR REPLACE FUNCTION validate_unified_member_type_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome do tipo de membro
  IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Nome do tipo de membro não pode estar vazio';
  END IF;
  
  -- Normalizar nome (primeira letra maiúscula)
  NEW.name = INITCAP(TRIM(NEW.name));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para validação automática
DROP TRIGGER IF EXISTS validate_member_type_trigger ON member_types;
CREATE TRIGGER validate_member_type_trigger
  BEFORE INSERT OR UPDATE ON member_types
  FOR EACH ROW
  EXECUTE FUNCTION validate_unified_member_type_data();

-- 9. Função para validar planos de assinatura
CREATE OR REPLACE FUNCTION validate_subscription_plan_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar título do plano
  IF NEW.plan_title IS NULL OR LENGTH(TRIM(NEW.plan_title)) = 0 THEN
    RAISE EXCEPTION 'Título do plano não pode estar vazio';
  END IF;
  
  -- Normalizar título
  NEW.plan_title = TRIM(NEW.plan_title);
  
  -- Validar preço
  IF NEW.price < 25.00 THEN
    RAISE EXCEPTION 'Preço deve ser no mínimo R$ 25,00';
  END IF;
  
  -- Validar recorrência
  IF NEW.recurrence NOT IN ('Mensal', 'Anual') THEN
    RAISE EXCEPTION 'Recorrência deve ser Mensal ou Anual';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para validação de planos
DROP TRIGGER IF EXISTS validate_subscription_plan_trigger ON subscription_plans;
CREATE TRIGGER validate_subscription_plan_trigger
  BEFORE INSERT OR UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_plan_data();