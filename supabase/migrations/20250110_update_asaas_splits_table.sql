-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabela a atualizar: asaas_splits
-- Status atual: Tabela EXISTE, 0 registros (verificado via Python e Supabase UI)
-- Estrutura atual identificada:
--   • id (uuid)
--   • cobranca_id (uuid)
--   • affiliate_id (uuid)
--   • percentage (numeric)
--   • fixed_value (numeric)
--   • wallet_id (character varying)
--   • total_value (numeric)
--   • status (character varying)
--   • asaas_split_id (character varying)
--   • commission_amount (numeric)
--   • processed_at (timestamptz)
--   • refusal_reason (text)
--   • error_message (text)
--   • retry_count (integer)
--   • created_at (timestamptz)
--   • updated_at (timestamptz)
-- Impacto: Adição de novas colunas para suportar divisão tripla (não destrutivo)
-- Verificações:
--   ✅ Tabela existe e está vazia (sem risco de perda de dados)
--   ✅ Nenhum dado será perdido
--   ✅ Alterações são aditivas (ADD COLUMN IF NOT EXISTS)
--   ✅ Estrutura atual será preservada
-- ============================================

-- ============================================
-- ATUALIZAÇÃO DA TABELA asaas_splits
-- ============================================
-- Objetivo: Permitir divisão tripla de pagamentos
-- A tabela já existe com estrutura focada em afiliados
-- Vamos adicionar campos para suportar múltiplos tipos de beneficiários
-- Mudanças:
-- 1. Adicionar campos para identificar tipo de beneficiário
-- 2. Adicionar campo service_type para categorizar o tipo de receita
-- 3. Remover constraint de unicidade em cobranca_id (se existir)
-- 4. Criar índices para performance
-- ============================================

-- ============================================
-- 1. ADICIONAR NOVOS CAMPOS
-- ============================================

-- Campo para tipo de beneficiário (comademig, renum, affiliate)
-- Isso permite identificar qual dos 3 beneficiários é este split
ALTER TABLE asaas_splits 
ADD COLUMN IF NOT EXISTS recipient_type TEXT 
CHECK (recipient_type IN ('comademig', 'renum', 'affiliate'));

-- Campo para nome/identificação do beneficiário
-- Útil para relatórios e auditoria
ALTER TABLE asaas_splits 
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Campo para tipo de serviço/receita
-- Permite aplicar regras diferentes por categoria (filiacao, servicos, publicidade)
ALTER TABLE asaas_splits 
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- ============================================
-- 2. REMOVER CONSTRAINT DE UNICIDADE
-- ============================================
-- Permitir múltiplos splits por cobranca_id (divisão tripla)

-- Verificar e remover constraint de unicidade se existir
DO $$ 
BEGIN
    -- Tentar remover constraint por nome comum em cobranca_id
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'asaas_splits_cobranca_id_key'
    ) THEN
        ALTER TABLE asaas_splits DROP CONSTRAINT asaas_splits_cobranca_id_key;
        RAISE NOTICE 'Constraint asaas_splits_cobranca_id_key removida';
    END IF;
    
    -- Tentar remover índice único se existir
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'asaas_splits_cobranca_id_key'
    ) THEN
        DROP INDEX IF EXISTS asaas_splits_cobranca_id_key;
        RAISE NOTICE 'Índice único asaas_splits_cobranca_id_key removido';
    END IF;
    
    -- Verificar outras possíveis constraints de unicidade
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%asaas_splits%unique%'
        OR conname LIKE '%asaas_splits%cobranca%'
    ) THEN
        RAISE NOTICE 'Outras constraints de unicidade encontradas - verificar manualmente';
    END IF;
END $$;

-- ============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice composto para buscar splits por cobranca_id e tipo de beneficiário
CREATE INDEX IF NOT EXISTS idx_asaas_splits_cobranca_recipient 
ON asaas_splits(cobranca_id, recipient_type);

-- Índice para buscar por tipo de beneficiário
CREATE INDEX IF NOT EXISTS idx_asaas_splits_recipient_type 
ON asaas_splits(recipient_type);

-- Índice para buscar por tipo de serviço
CREATE INDEX IF NOT EXISTS idx_asaas_splits_service_type 
ON asaas_splits(service_type);

-- Índice composto para relatórios (tipo de beneficiário + status)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_recipient_status 
ON asaas_splits(recipient_type, status);

-- Índice para buscar por wallet_id (já existe como coluna)
CREATE INDEX IF NOT EXISTS idx_asaas_splits_wallet 
ON asaas_splits(wallet_id) 
WHERE wallet_id IS NOT NULL;

-- ============================================
-- 4. TRIGGER PARA ATUALIZAR updated_at
-- ============================================
-- (Verificar se já existe antes de criar)

CREATE OR REPLACE FUNCTION update_asaas_splits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_asaas_splits_updated_at ON asaas_splits;

-- Criar trigger
CREATE TRIGGER trigger_update_asaas_splits_updated_at
  BEFORE UPDATE ON asaas_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_asaas_splits_updated_at();

-- ============================================
-- 5. COMENTÁRIOS NAS NOVAS COLUNAS
-- ============================================

COMMENT ON TABLE asaas_splits IS 'Registra a divisão de pagamentos entre múltiplos beneficiários (COMADEMIG, RENUM, Afiliados)';
COMMENT ON COLUMN asaas_splits.cobranca_id IS 'ID da cobrança no sistema (referência à tabela asaas_cobrancas)';
COMMENT ON COLUMN asaas_splits.recipient_type IS 'Tipo de beneficiário: comademig (conta principal), renum (parceiro fixo), affiliate (afiliado dinâmico)';
COMMENT ON COLUMN asaas_splits.recipient_name IS 'Nome/identificação do beneficiário para relatórios';
COMMENT ON COLUMN asaas_splits.wallet_id IS 'Wallet ID do Asaas do beneficiário (NULL para COMADEMIG que recebe direto)';
COMMENT ON COLUMN asaas_splits.percentage IS 'Percentual do split (ex: 40.00 para 40%)';
COMMENT ON COLUMN asaas_splits.commission_amount IS 'Valor em reais do split/comissão';
COMMENT ON COLUMN asaas_splits.total_value IS 'Valor total do pagamento';
COMMENT ON COLUMN asaas_splits.service_type IS 'Tipo de serviço/receita: filiacao, servicos, publicidade, etc';
COMMENT ON COLUMN asaas_splits.status IS 'Status do split: PENDING, PROCESSED, CANCELLED, ERROR';
COMMENT ON COLUMN asaas_splits.asaas_split_id IS 'ID do split criado no Asaas (NULL para COMADEMIG)';
COMMENT ON COLUMN asaas_splits.error_message IS 'Mensagem de erro se o processamento falhar';
COMMENT ON COLUMN asaas_splits.affiliate_id IS 'ID do afiliado (quando recipient_type = affiliate)';

-- ============================================
-- 6. QUERIES DE VALIDAÇÃO
-- ============================================
-- Execute estas queries após aplicar o script para validar:

-- Verificar estrutura da tabela
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'asaas_splits'
-- ORDER BY ordinal_position;

-- Verificar índices criados
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'asaas_splits'
-- ORDER BY indexname;

-- Verificar constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'asaas_splits'::regclass;

-- Testar inserção de múltiplos splits para mesma cobranca_id
-- INSERT INTO asaas_splits (cobranca_id, recipient_type, recipient_name, percentage, commission_amount, total_value, service_type, status)
-- VALUES 
--   (gen_random_uuid(), 'comademig', 'COMADEMIG', 40.00, 400.00, 1000.00, 'filiacao', 'PENDING'),
--   (gen_random_uuid(), 'renum', 'RENUM', 40.00, 400.00, 1000.00, 'filiacao', 'PENDING'),
--   (gen_random_uuid(), 'affiliate', 'Afiliado Teste', 20.00, 200.00, 1000.00, 'filiacao', 'PENDING');

-- Verificar se múltiplos splits foram inseridos
-- SELECT cobranca_id, recipient_type, recipient_name, percentage, commission_amount 
-- FROM asaas_splits 
-- ORDER BY created_at DESC 
-- LIMIT 3;

-- Limpar dados de teste (ajustar IDs conforme necessário)
-- DELETE FROM asaas_splits WHERE recipient_name IN ('COMADEMIG', 'RENUM', 'Afiliado Teste') AND created_at > NOW() - INTERVAL '5 minutes';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
