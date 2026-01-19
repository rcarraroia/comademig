-- ============================================
-- MIGRAÇÃO PRINCIPAL: Sistema de Tipos de Membro e Planos de Assinatura
-- ============================================
-- Data de Criação: 2025-01-09
-- Última Atualização: 2025-11-28
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- 
-- IMPORTANTE: Esta migração documenta a estrutura esperada do sistema.
-- As tabelas member_types e subscription_plans JÁ EXISTEM no banco de produção
-- e foram criadas através de migrações anteriores aplicadas via Dashboard.
-- 
-- Estado Atual Verificado (2025-11-28):
-- - member_types: 4 registros (Bispo, Pastor, Diácono, Membro)
-- - subscription_plans: 12 registros (3 periodicidades por cargo)
-- 
-- Migrações históricas completas disponíveis em: supabase/migrations_backup/
-- ============================================

-- =====================================================
-- VERIFICAÇÃO: Tabelas já existem no banco
-- =====================================================
-- Esta seção apenas documenta a estrutura esperada.
-- NÃO executa criação se tabelas já existem.

DO $$ 
BEGIN
  -- Verificar se member_types existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'member_types'
  ) THEN
    RAISE NOTICE 'Tabela member_types não existe. Criando...';
    
    -- Criar tabela member_types
    CREATE TABLE member_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    
    -- Inserir tipos padrão
    INSERT INTO member_types (name, description, is_active, sort_order) VALUES
      ('Bispo', 'Bispo da Assembleia de Deus', true, 1),
      ('Pastor', 'Pastor da Assembleia de Deus', true, 2),
      ('Diácono', 'Diácono da Assembleia de Deus', true, 3),
      ('Membro', 'Membro da Assembleia de Deus', true, 4);
    
    RAISE NOTICE 'Tabela member_types criada com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela member_types já existe. Pulando criação.';
  END IF;

  -- Verificar se subscription_plans existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_plans'
  ) THEN
    RAISE NOTICE 'Tabela subscription_plans não existe. Criando...';
    
    -- Criar tabela subscription_plans
    CREATE TABLE subscription_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_type_id UUID REFERENCES member_types(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      recurrence TEXT NOT NULL DEFAULT 'monthly',
      duration_months INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      features JSONB DEFAULT '{}',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      CONSTRAINT unique_member_type_duration UNIQUE (member_type_id, duration_months)
    );
    
    -- Criar índice
    CREATE INDEX idx_subscription_plans_member_type_id ON subscription_plans(member_type_id);
    
    -- Inserir planos padrão (mensal, semestral, anual para cada cargo)
    INSERT INTO subscription_plans (member_type_id, name, price, recurrence, duration_months, is_active, sort_order, features)
    SELECT 
      mt.id,
      mt.name || ' - Mensal',
      CASE mt.name
        WHEN 'Bispo' THEN 10.00
        WHEN 'Pastor' THEN 15.00
        WHEN 'Diácono' THEN 8.00
        WHEN 'Membro' THEN 5.00
      END,
      'monthly',
      1,
      true,
      1,
      '{"certidoes": 5, "suporte": "email", "carteira_digital": true}'
    FROM member_types mt
    WHERE mt.is_active = true;
    
    INSERT INTO subscription_plans (member_type_id, name, price, recurrence, duration_months, is_active, sort_order, features)
    SELECT 
      mt.id,
      mt.name || ' - Semestral',
      CASE mt.name
        WHEN 'Bispo' THEN 55.00
        WHEN 'Pastor' THEN 85.00
        WHEN 'Diácono' THEN 45.00
        WHEN 'Membro' THEN 28.00
      END,
      'monthly',
      6,
      true,
      2,
      '{"certidoes": "unlimited", "suporte": "priority", "carteira_digital": true, "desconto": "8%"}'
    FROM member_types mt
    WHERE mt.is_active = true;
    
    INSERT INTO subscription_plans (member_type_id, name, price, recurrence, duration_months, is_active, sort_order, features)
    SELECT 
      mt.id,
      mt.name || ' - Anual',
      CASE mt.name
        WHEN 'Bispo' THEN 100.00
        WHEN 'Pastor' THEN 150.00
        WHEN 'Diácono' THEN 80.00
        WHEN 'Membro' THEN 50.00
      END,
      'monthly',
      12,
      true,
      3,
      '{"certidoes": "unlimited", "suporte": "phone", "carteira_digital": true, "desconto": "17%"}'
    FROM member_types mt
    WHERE mt.is_active = true;
    
    RAISE NOTICE 'Tabela subscription_plans criada com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela subscription_plans já existe. Pulando criação.';
  END IF;
END $$;

-- =====================================================
-- POLÍTICAS RLS (aplicar apenas se não existirem)
-- =====================================================

-- Habilitar RLS
ALTER TABLE member_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas para member_types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'member_types' 
    AND policyname = 'member_types_public_read'
  ) THEN
    CREATE POLICY "member_types_public_read" ON member_types
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Políticas para subscription_plans
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Planos públicos para leitura'
  ) THEN
    CREATE POLICY "Planos públicos para leitura" ON subscription_plans
      FOR SELECT USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Admins gerenciam planos'
  ) THEN
    CREATE POLICY "Admins gerenciam planos" ON subscription_plans
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
      );
  END IF;
END $$;

-- =====================================================
-- TRIGGERS (aplicar apenas se não existirem)
-- =====================================================

-- Função para auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para member_types
DROP TRIGGER IF EXISTS update_member_types_updated_at ON member_types;
CREATE TRIGGER update_member_types_updated_at
    BEFORE UPDATE ON member_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estado das tabelas
DO $$ 
DECLARE
  member_types_count INTEGER;
  subscription_plans_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_types_count FROM member_types WHERE is_active = true;
  SELECT COUNT(*) INTO subscription_plans_count FROM subscription_plans WHERE is_active = true;
  
  RAISE NOTICE '✅ Verificação concluída:';
  RAISE NOTICE '   - member_types ativos: %', member_types_count;
  RAISE NOTICE '   - subscription_plans ativos: %', subscription_plans_count;
  
  IF member_types_count >= 4 AND subscription_plans_count >= 12 THEN
    RAISE NOTICE '✅ Sistema de tipos de membro e planos está operacional!';
  ELSE
    RAISE WARNING '⚠️ Contagem de registros abaixo do esperado. Verificar dados.';
  END IF;
END $$;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
