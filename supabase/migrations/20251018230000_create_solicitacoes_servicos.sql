-- ============================================
-- MIGRAÇÃO: Criar tabela solicitacoes_servicos
-- Data: 2025-10-18
-- Objetivo: Garantir que a tabela existe com estrutura correta
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS solicitacoes_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  dados_enviados JSONB DEFAULT '{}'::jsonb,
  observacoes_admin TEXT,
  arquivo_entrega TEXT,
  status TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue', 'cancelada')),
  payment_reference TEXT,
  valor_pago DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao', 'boleto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data_pagamento TIMESTAMPTZ,
  data_analise TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id ON solicitacoes_servicos(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_servico_id ON solicitacoes_servicos(servico_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_servicos(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_payment_ref ON solicitacoes_servicos(payment_reference);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created_at ON solicitacoes_servicos(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_solicitacoes_updated_at ON solicitacoes_servicos;
CREATE TRIGGER trigger_update_solicitacoes_updated_at
  BEFORE UPDATE ON solicitacoes_servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_solicitacoes_updated_at();

-- Comentário
COMMENT ON TABLE solicitacoes_servicos IS 'Solicitações de serviços dos usuários';
