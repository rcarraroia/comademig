-- ============================================
-- MIGRAÇÃO: Sistema de Logs Payment First Flow
-- ============================================
-- Data: 2026-01-25
-- Objetivo: Criar tabelas para logging e monitoramento do Payment First Flow
-- Requirements: 8.1, 8.2, 8.5

-- Tabela de logs de eventos do Payment First Flow
CREATE TABLE IF NOT EXISTS payment_first_flow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'registration_started',
    'payment_processed',
    'payment_failed',
    'account_created',
    'account_creation_failed',
    'subscription_created',
    'fallback_stored',
    'process_completed',
    'process_failed'
  )),
  user_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  asaas_customer_id TEXT,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  member_type TEXT,
  plan_id TEXT,
  affiliate_id TEXT,
  processing_time_ms INTEGER,
  error_message TEXT,
  error_code TEXT,
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_logs_event_type ON payment_first_flow_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_logs_created_at ON payment_first_flow_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_logs_user_email ON payment_first_flow_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_logs_user_id ON payment_first_flow_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_logs_asaas_payment_id ON payment_first_flow_logs(asaas_payment_id);

-- Tabela de métricas agregadas
CREATE TABLE IF NOT EXISTS payment_first_flow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  total_registrations INTEGER DEFAULT 0,
  successful_registrations INTEGER DEFAULT 0,
  failed_registrations INTEGER DEFAULT 0,
  payment_failures INTEGER DEFAULT 0,
  account_creation_failures INTEGER DEFAULT 0,
  fallback_activations INTEGER DEFAULT 0,
  avg_processing_time_ms NUMERIC(10,2),
  max_processing_time_ms INTEGER,
  min_processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, hour)
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_metrics_date ON payment_first_flow_metrics(date);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_metrics_date_hour ON payment_first_flow_metrics(date, hour);

-- Tabela de alertas
CREATE TABLE IF NOT EXISTS payment_first_flow_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'high_failure_rate',
    'slow_processing',
    'payment_gateway_issues',
    'fallback_threshold_exceeded',
    'system_error'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  threshold_value NUMERIC,
  current_value NUMERIC,
  context JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_alerts_alert_type ON payment_first_flow_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_alerts_severity ON payment_first_flow_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_alerts_is_resolved ON payment_first_flow_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_payment_first_flow_alerts_created_at ON payment_first_flow_alerts(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_payment_first_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER payment_first_flow_logs_updated_at
  BEFORE UPDATE ON payment_first_flow_logs
  FOR EACH ROW EXECUTE FUNCTION update_payment_first_flow_updated_at();

CREATE TRIGGER payment_first_flow_metrics_updated_at
  BEFORE UPDATE ON payment_first_flow_metrics
  FOR EACH ROW EXECUTE FUNCTION update_payment_first_flow_updated_at();

CREATE TRIGGER payment_first_flow_alerts_updated_at
  BEFORE UPDATE ON payment_first_flow_alerts
  FOR EACH ROW EXECUTE FUNCTION update_payment_first_flow_updated_at();

-- Função para calcular métricas agregadas
CREATE OR REPLACE FUNCTION calculate_payment_first_flow_metrics(
  target_date DATE DEFAULT CURRENT_DATE,
  target_hour INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  metrics_record RECORD;
BEGIN
  -- Definir período de cálculo
  IF target_hour IS NULL THEN
    start_time := target_date::TIMESTAMPTZ;
    end_time := (target_date + INTERVAL '1 day')::TIMESTAMPTZ;
  ELSE
    start_time := (target_date + (target_hour || ' hours')::INTERVAL)::TIMESTAMPTZ;
    end_time := start_time + INTERVAL '1 hour';
  END IF;

  -- Calcular métricas
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'registration_started') as total_registrations,
    COUNT(*) FILTER (WHERE event_type = 'process_completed') as successful_registrations,
    COUNT(*) FILTER (WHERE event_type = 'process_failed') as failed_registrations,
    COUNT(*) FILTER (WHERE event_type = 'payment_failed') as payment_failures,
    COUNT(*) FILTER (WHERE event_type = 'account_creation_failed') as account_creation_failures,
    COUNT(*) FILTER (WHERE event_type = 'fallback_stored') as fallback_activations,
    AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as avg_processing_time_ms,
    MAX(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as max_processing_time_ms,
    MIN(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as min_processing_time_ms
  INTO metrics_record
  FROM payment_first_flow_logs
  WHERE created_at >= start_time AND created_at < end_time;

  -- Inserir ou atualizar métricas
  INSERT INTO payment_first_flow_metrics (
    date, hour, total_registrations, successful_registrations, failed_registrations,
    payment_failures, account_creation_failures, fallback_activations,
    avg_processing_time_ms, max_processing_time_ms, min_processing_time_ms
  ) VALUES (
    target_date, target_hour, 
    COALESCE(metrics_record.total_registrations, 0),
    COALESCE(metrics_record.successful_registrations, 0),
    COALESCE(metrics_record.failed_registrations, 0),
    COALESCE(metrics_record.payment_failures, 0),
    COALESCE(metrics_record.account_creation_failures, 0),
    COALESCE(metrics_record.fallback_activations, 0),
    metrics_record.avg_processing_time_ms,
    metrics_record.max_processing_time_ms,
    metrics_record.min_processing_time_ms
  )
  ON CONFLICT (date, hour) DO UPDATE SET
    total_registrations = EXCLUDED.total_registrations,
    successful_registrations = EXCLUDED.successful_registrations,
    failed_registrations = EXCLUDED.failed_registrations,
    payment_failures = EXCLUDED.payment_failures,
    account_creation_failures = EXCLUDED.account_creation_failures,
    fallback_activations = EXCLUDED.fallback_activations,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    max_processing_time_ms = EXCLUDED.max_processing_time_ms,
    min_processing_time_ms = EXCLUDED.min_processing_time_ms,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE payment_first_flow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_first_flow_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_first_flow_alerts ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all payment first flow logs" ON payment_first_flow_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem ver todas as métricas
CREATE POLICY "Admins can view all payment first flow metrics" ON payment_first_flow_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem gerenciar alertas
CREATE POLICY "Admins can manage payment first flow alerts" ON payment_first_flow_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comentários nas tabelas
COMMENT ON TABLE payment_first_flow_logs IS 'Logs detalhados de eventos do Payment First Flow';
COMMENT ON TABLE payment_first_flow_metrics IS 'Métricas agregadas por hora/dia do Payment First Flow';
COMMENT ON TABLE payment_first_flow_alerts IS 'Alertas e notificações do sistema de monitoramento';

COMMENT ON FUNCTION calculate_payment_first_flow_metrics IS 'Calcula métricas agregadas para um período específico';