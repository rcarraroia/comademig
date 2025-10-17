-- ============================================================================
-- MIGRATION: FIX - Dropar e recriar tabela solicitacoes_servicos
-- Data: 2025-01-09
-- Descrição: Corrigir estrutura da tabela solicitacoes_servicos
-- ============================================================================

-- 1. Dropar tabela existente (se existir)
DROP TABLE IF EXISTS solicitacoes_servicos CASCADE;

-- 2. Dropar funções existentes (se existirem)
DROP FUNCTION IF EXISTS gerar_protocolo_solicitacao() CASCADE;
DROP FUNCTION IF EXISTS set_protocolo_solicitacao() CASCADE;
DROP FUNCTION IF EXISTS atualizar_data_status_solicitacao() CASCADE;

-- 3. Criar tabela solicitacoes_servicos
CREATE TABLE solicitacoes_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo VARCHAR(20) UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  dados_enviados JSONB NOT NULL DEFAULT '{}'::jsonb,
  observacoes_admin TEXT,
  arquivo_entrega TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pago' CHECK (
    status IN ('pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue', 'cancelada')
  ),
  payment_reference VARCHAR(100),
  valor_pago DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR(20) CHECK (forma_pagamento IN ('pix', 'cartao', 'boleto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_pagamento TIMESTAMPTZ,
  data_analise TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ
);

-- 4. Comentários
COMMENT ON TABLE solicitacoes_servicos IS 'Tabela unificada para todas as solicitações de serviços';
COMMENT ON COLUMN solicitacoes_servicos.protocolo IS 'Número único de protocolo gerado automaticamente';
COMMENT ON COLUMN solicitacoes_servicos.dados_enviados IS 'Dados do formulário em JSON';

-- 5. Função para gerar protocolo
CREATE FUNCTION gerar_protocolo_solicitacao()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  novo_protocolo TEXT;
  protocolo_existe BOOLEAN;
BEGIN
  LOOP
    novo_protocolo := 'SS' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM solicitacoes_servicos WHERE protocolo = novo_protocolo) INTO protocolo_existe;
    IF NOT protocolo_existe THEN
      RETURN novo_protocolo;
    END IF;
  END LOOP;
END;
$$;

-- 6. Função trigger para protocolo
CREATE FUNCTION set_protocolo_solicitacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.protocolo IS NULL OR NEW.protocolo = '' THEN
    NEW.protocolo := gerar_protocolo_solicitacao();
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Função trigger para datas de status
CREATE FUNCTION atualizar_data_status_solicitacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pago' AND (OLD IS NULL OR OLD.status != 'pago') THEN
    NEW.data_pagamento := NOW();
  END IF;
  
  IF NEW.status = 'em_analise' AND (OLD IS NULL OR OLD.status != 'em_analise') THEN
    NEW.data_analise := NOW();
  END IF;
  
  IF NEW.status IN ('entregue', 'rejeitada', 'cancelada') AND 
     (OLD IS NULL OR OLD.status NOT IN ('entregue', 'rejeitada', 'cancelada')) THEN
    NEW.data_conclusao := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Criar triggers
CREATE TRIGGER update_solicitacoes_servicos_updated_at
  BEFORE UPDATE ON solicitacoes_servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_set_protocolo
  BEFORE INSERT ON solicitacoes_servicos
  FOR EACH ROW
  EXECUTE FUNCTION set_protocolo_solicitacao();

CREATE TRIGGER trigger_atualizar_data_status
  BEFORE UPDATE ON solicitacoes_servicos
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION atualizar_data_status_solicitacao();

-- 9. Criar índices
CREATE INDEX idx_solicitacoes_user_id ON solicitacoes_servicos(user_id);
CREATE INDEX idx_solicitacoes_servico_id ON solicitacoes_servicos(servico_id);
CREATE INDEX idx_solicitacoes_status ON solicitacoes_servicos(status);
CREATE INDEX idx_solicitacoes_protocolo ON solicitacoes_servicos(protocolo);
CREATE INDEX idx_solicitacoes_payment_ref ON solicitacoes_servicos(payment_reference);
CREATE INDEX idx_solicitacoes_created_at ON solicitacoes_servicos(created_at DESC);
CREATE INDEX idx_solicitacoes_dados_enviados ON solicitacoes_servicos USING GIN (dados_enviados);

-- 10. Validação
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'solicitacoes_servicos';
  IF v_count > 0 THEN
    RAISE NOTICE '✅ Tabela solicitacoes_servicos criada';
  ELSE
    RAISE EXCEPTION '❌ Falha ao criar tabela';
  END IF;
  
  SELECT COUNT(*) INTO v_count FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'solicitacoes_servicos';
  RAISE NOTICE '✅ Índices criados: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgrelid = 'solicitacoes_servicos'::regclass;
  RAISE NOTICE '✅ Triggers criados: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM pg_proc WHERE proname IN ('gerar_protocolo_solicitacao', 'set_protocolo_solicitacao', 'atualizar_data_status_solicitacao');
  RAISE NOTICE '✅ Funções criadas: %', v_count;
  
  RAISE NOTICE '✅ SUCESSO: Tabela solicitacoes_servicos configurada completamente';
END $$;
