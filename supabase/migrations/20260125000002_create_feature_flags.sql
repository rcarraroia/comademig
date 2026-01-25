-- ============================================
-- MIGRAÇÃO: Sistema de Feature Flags
-- ============================================
-- Data: 2026-01-25
-- Objetivo: Criar sistema de feature flags para controle de rollout
-- Requirements: 9.5

-- Tabela de feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_groups TEXT[] DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_rollout_percentage ON feature_flags(rollout_percentage);

-- Tabela de histórico de mudanças de feature flags
CREATE TABLE IF NOT EXISTS feature_flag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'enabled', 'disabled', 'percentage_changed', 'conditions_updated')),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_feature_flag_history_feature_flag_id ON feature_flag_history(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_history_action ON feature_flag_history(action);
CREATE INDEX IF NOT EXISTS idx_feature_flag_history_created_at ON feature_flag_history(created_at);

-- Função para registrar mudanças no histórico
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO feature_flag_history (feature_flag_id, action, new_value, changed_by)
    VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log mudança de status
    IF OLD.is_enabled != NEW.is_enabled THEN
      INSERT INTO feature_flag_history (feature_flag_id, action, old_value, new_value, changed_by)
      VALUES (
        NEW.id, 
        CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END,
        jsonb_build_object('is_enabled', OLD.is_enabled),
        jsonb_build_object('is_enabled', NEW.is_enabled),
        NEW.updated_by
      );
    END IF;
    
    -- Log mudança de percentual
    IF OLD.rollout_percentage != NEW.rollout_percentage THEN
      INSERT INTO feature_flag_history (feature_flag_id, action, old_value, new_value, changed_by)
      VALUES (
        NEW.id,
        'percentage_changed',
        jsonb_build_object('rollout_percentage', OLD.rollout_percentage),
        jsonb_build_object('rollout_percentage', NEW.rollout_percentage),
        NEW.updated_by
      );
    END IF;
    
    -- Log mudança de condições
    IF OLD.conditions != NEW.conditions THEN
      INSERT INTO feature_flag_history (feature_flag_id, action, old_value, new_value, changed_by)
      VALUES (
        NEW.id,
        'conditions_updated',
        jsonb_build_object('conditions', OLD.conditions),
        jsonb_build_object('conditions', NEW.conditions),
        NEW.updated_by
      );
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log de mudanças
CREATE TRIGGER feature_flags_change_log
  AFTER INSERT OR UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION log_feature_flag_change();

-- Trigger para updated_at
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_payment_first_flow_updated_at();

-- Função para verificar se feature flag está ativa para um usuário
CREATE OR REPLACE FUNCTION is_feature_enabled(
  flag_name TEXT,
  user_email TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL,
  user_groups TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  flag_record feature_flags%ROWTYPE;
  hash_value INTEGER;
  user_percentage INTEGER;
BEGIN
  -- Buscar feature flag
  SELECT * INTO flag_record FROM feature_flags WHERE name = flag_name;
  
  -- Se não existe, retorna false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Se não está habilitada, retorna false
  IF NOT flag_record.is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Se rollout é 100%, retorna true
  IF flag_record.rollout_percentage >= 100 THEN
    RETURN TRUE;
  END IF;
  
  -- Se rollout é 0%, retorna false
  IF flag_record.rollout_percentage <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar grupos alvo
  IF array_length(flag_record.target_groups, 1) > 0 THEN
    IF user_groups && flag_record.target_groups THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Calcular hash baseado no email do usuário para distribuição consistente
  IF user_email IS NOT NULL THEN
    hash_value := abs(hashtext(flag_name || ':' || user_email));
    user_percentage := hash_value % 100;
    RETURN user_percentage < flag_record.rollout_percentage;
  END IF;
  
  -- Se não tem email, usar user_id
  IF user_id IS NOT NULL THEN
    hash_value := abs(hashtext(flag_name || ':' || user_id::text));
    user_percentage := hash_value % 100;
    RETURN user_percentage < flag_record.rollout_percentage;
  END IF;
  
  -- Fallback: retorna false se não tem identificador
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_history ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar feature flags
CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Usuários autenticados podem ler feature flags (para verificar se estão ativas)
CREATE POLICY "Authenticated users can read feature flags" ON feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins podem ver histórico
CREATE POLICY "Admins can view feature flag history" ON feature_flag_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Inserir feature flags iniciais
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage, created_by) VALUES
  (
    'payment_first_flow', 
    'Habilita o novo fluxo de pagamento antes da criação de conta',
    FALSE,
    0,
    NULL
  ),
  (
    'payment_first_flow_monitoring', 
    'Habilita o dashboard de monitoramento do Payment First Flow',
    TRUE,
    100,
    NULL
  ),
  (
    'payment_first_flow_fallback', 
    'Habilita o sistema de fallback para recuperação de falhas',
    TRUE,
    100,
    NULL
  )
ON CONFLICT (name) DO NOTHING;

-- Comentários
COMMENT ON TABLE feature_flags IS 'Sistema de feature flags para controle de rollout';
COMMENT ON TABLE feature_flag_history IS 'Histórico de mudanças nas feature flags';
COMMENT ON FUNCTION is_feature_enabled IS 'Verifica se uma feature flag está ativa para um usuário específico';