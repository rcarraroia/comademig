-- ============================================
-- MIGRAÇÃO: Criar tabelas para Payment First Flow
-- Data: 2026-01-22
-- Objetivo: Criar tabelas de fallback para inversão do fluxo de registro
-- ============================================

-- Tabela para armazenar assinaturas pendentes
CREATE TABLE IF NOT EXISTS pending_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL, -- Asaas customer ID
  payment_id TEXT NOT NULL, -- Asaas payment ID
  credit_card_token TEXT NOT NULL, -- Token para criar assinatura
  value DECIMAL(10,2) NOT NULL,
  cycle TEXT NOT NULL, -- MONTHLY/SEMIANNUALLY/YEARLY
  next_due_date DATE NOT NULL,
  affiliate_wallet_id TEXT, -- Para split, se houver
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Tabela para armazenar contas pendentes
CREATE TABLE IF NOT EXISTS pending_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Hash da senha fornecida
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT NOT NULL,
  customer_id TEXT NOT NULL, -- Asaas customer ID
  payment_id TEXT NOT NULL, -- Asaas payment ID  
  subscription_id TEXT NOT NULL, -- Asaas subscription ID
  member_type_id UUID NOT NULL,
  affiliate_code TEXT, -- Se veio por afiliado
  profile_data JSONB NOT NULL, -- Todos dados do perfil
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Índices para performance - pending_subscriptions
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_status ON pending_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_created ON pending_subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_payment_id ON pending_subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_customer_id ON pending_subscriptions(customer_id);

-- Índices para performance - pending_completions
CREATE INDEX IF NOT EXISTS idx_pending_completions_email ON pending_completions(email);
CREATE INDEX IF NOT EXISTS idx_pending_completions_status ON pending_completions(status);
CREATE INDEX IF NOT EXISTS idx_pending_completions_created ON pending_completions(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_completions_payment_id ON pending_completions(payment_id);

-- Triggers para atualizar updated_at (se necessário no futuro)
-- Por enquanto não implementado para manter simplicidade

-- RLS Policies
ALTER TABLE pending_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_completions ENABLE ROW LEVEL SECURITY;

-- Política para pending_subscriptions - apenas admins
CREATE POLICY "pending_subscriptions_admin_all" ON pending_subscriptions
FOR ALL USING (
  COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), ''::text) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- Política para pending_completions - apenas admins
CREATE POLICY "pending_completions_admin_all" ON pending_completions
FOR ALL USING (
  COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'user_role'::text), ''::text) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- Comentários
COMMENT ON TABLE pending_subscriptions IS 'Assinaturas pendentes quando falha criação após pagamento confirmado';
COMMENT ON TABLE pending_completions IS 'Contas pendentes quando falha criação após pagamento e assinatura confirmados';