-- ============================================================================
-- MIGRATION: Criar tabela solicitacoes_servicos
-- Data: 2025-01-09
-- Descrição: Tabela unificada para todas as solicitações de serviços
-- ============================================================================

-- 1. Criar tabela solicitacoes_servicos
CREATE TABLE IF NOT EXISTS solicitacoes_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  servico_id UUID NOT NULL REFERENCES servicos(id),
  numero_protocolo TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue')),
  valor_total NUMERIC(10,2) NOT NULL CHECK (valor_total >= 0),
  payment_reference TEXT, -- ID da cobrança Asaas
  dados_enviados JSONB NOT NULL, -- Formulário preenchido pelo usuário
  observacoes_usuario TEXT,
  observacoes_admin TEXT,
  arquivo_entrega TEXT, -- URL do arquivo entregue
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aprovacao TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user ON solicitacoes_servicos(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_servico ON solicitacoes_servicos(servico_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_servicos(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_protocolo ON solicitacoes_servicos(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_payment ON solicitacoes_servicos(payment_reference);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data ON solicitacoes_servicos(data_solicitacao DESC);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_solicitacoes_updated_at
  BEFORE UPDATE ON solicitacoes_servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_solicitacoes_updated_at();

-- 4. Criar função para gerar número de protocolo único
CREATE OR REPLACE FUNCTION gerar_numero_protocolo()
RETURNS TEXT AS $$
DECLARE
  protocolo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Formato: SERV-YYYYMMDD-XXXXXX (ex: SERV-20250109-A1B2C3)
    protocolo := 'SERV-' || 
                 TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM solicitacoes_servicos WHERE numero_protocolo = protocolo
    ) INTO existe;
    
    EXIT WHEN NOT existe;
  END LOOP;
  
  RETURN protocolo;
END;
$$ LANGUAGE plpgsql;

-- 5. Adicionar comentários para documentação
COMMENT ON TABLE solicitacoes_servicos IS 'Solicitações de serviços dos usuários (certidões, regularização, etc)';
COMMENT ON COLUMN solicitacoes_servicos.numero_protocolo IS 'Número único de protocolo da solicitação';
COMMENT ON COLUMN solicitacoes_servicos.status IS 'Status: pago (aguardando), em_analise, aprovada, rejeitada, entregue';
COMMENT ON COLUMN solicitacoes_servicos.payment_reference IS 'ID da cobrança no Asaas';
COMMENT ON COLUMN solicitacoes_servicos.dados_enviados IS 'Dados do formulário preenchido pelo usuário (JSON)';
COMMENT ON COLUMN solicitacoes_servicos.arquivo_entrega IS 'URL do arquivo entregue (PDF, etc)';

-- 6. Validar que a tabela foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'solicitacoes_servicos'
  ) THEN
    RAISE EXCEPTION 'Tabela solicitacoes_servicos não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Tabela solicitacoes_servicos criada com sucesso!';
END $$;
