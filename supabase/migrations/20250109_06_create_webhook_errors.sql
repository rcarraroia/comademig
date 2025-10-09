-- Tabela para registrar erros de webhook e permitir retry
CREATE TABLE IF NOT EXISTS webhook_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  payload JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_webhook_errors_payment_id ON webhook_errors(payment_id);
CREATE INDEX idx_webhook_errors_resolved ON webhook_errors(resolved);
CREATE INDEX idx_webhook_errors_created_at ON webhook_errors(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_webhook_errors_updated_at
  BEFORE UPDATE ON webhook_errors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE webhook_errors ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver erros de webhook
CREATE POLICY "Admins podem ver erros de webhook"
  ON webhook_errors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- Apenas admins podem atualizar (para marcar como resolvido)
CREATE POLICY "Admins podem atualizar erros de webhook"
  ON webhook_errors
  FOR UPDATE
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

-- Service role pode inserir
CREATE POLICY "Service role pode inserir erros"
  ON webhook_errors
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE webhook_errors IS 'Registro de erros de processamento de webhooks para retry manual';
COMMENT ON COLUMN webhook_errors.payment_id IS 'ID do pagamento no Asaas';
COMMENT ON COLUMN webhook_errors.retry_count IS 'Número de tentativas de reprocessamento';
COMMENT ON COLUMN webhook_errors.resolved IS 'Indica se o erro foi resolvido';
