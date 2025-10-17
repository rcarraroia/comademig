-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabela a criar: affiliate_referrals
-- Status atual: Tabela NÃO EXISTE (verificado via Python)
-- Tabelas relacionadas verificadas:
--   ✅ affiliates: Existe, 0 registros
--   ✅ profiles: Existe (tabela de usuários)
-- Impacto: Criação de nova tabela (não destrutivo)
-- Verificações:
--   ✅ Nenhuma tabela com nome similar existe
--   ✅ Tabelas relacionadas (affiliates, profiles) existem
--   ✅ Nenhum dado será perdido
--   ✅ Foreign keys compatíveis com estrutura existente
-- ============================================

-- ============================================
-- CRIAÇÃO DA TABELA affiliate_referrals
-- ============================================
-- Esta tabela registra as indicações feitas por afiliados
-- Relacionamentos:
-- - affiliate_id -> affiliates(id)
-- - referred_user_id -> profiles(id)
-- ============================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento com afiliado (quem indicou)
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  
  -- Relacionamento com usuário indicado
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Código de indicação usado
  referral_code TEXT NOT NULL,
  
  -- Status da indicação
  status TEXT NOT NULL CHECK (status IN ('pending', 'converted', 'cancelled')) DEFAULT 'pending',
  
  -- Data de conversão (quando o indicado fez o primeiro pagamento)
  conversion_date TIMESTAMPTZ,
  
  -- Valor da conversão
  conversion_value DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para buscar indicações por afiliado
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate 
ON affiliate_referrals(affiliate_id);

-- Índice para buscar indicações por usuário indicado
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred 
ON affiliate_referrals(referred_user_id);

-- Índice para buscar por código de indicação
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code 
ON affiliate_referrals(referral_code);

-- Índice para buscar por status
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status 
ON affiliate_referrals(status);

-- Índice composto para queries comuns (afiliado + status)
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_status 
ON affiliate_referrals(affiliate_id, status);

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_affiliate_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_referrals_updated_at
  BEFORE UPDATE ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_referrals_updated_at();

-- ============================================
-- COMENTÁRIOS NA TABELA E COLUNAS
-- ============================================

COMMENT ON TABLE affiliate_referrals IS 'Registra as indicações feitas por afiliados do programa';
COMMENT ON COLUMN affiliate_referrals.id IS 'Identificador único da indicação';
COMMENT ON COLUMN affiliate_referrals.affiliate_id IS 'ID do afiliado que fez a indicação';
COMMENT ON COLUMN affiliate_referrals.referred_user_id IS 'ID do usuário que foi indicado';
COMMENT ON COLUMN affiliate_referrals.referral_code IS 'Código de indicação usado no cadastro';
COMMENT ON COLUMN affiliate_referrals.status IS 'Status da indicação: pending (aguardando conversão), converted (convertido em pagamento), cancelled (cancelado)';
COMMENT ON COLUMN affiliate_referrals.conversion_date IS 'Data em que a indicação foi convertida (primeiro pagamento)';
COMMENT ON COLUMN affiliate_referrals.conversion_value IS 'Valor da conversão (valor do primeiro pagamento)';

-- ============================================
-- CONSTRAINT ADICIONAL
-- ============================================

-- Garantir que um usuário não seja indicado múltiplas vezes
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_referrals_unique_referred 
ON affiliate_referrals(referred_user_id);

-- ============================================
-- QUERIES DE VALIDAÇÃO
-- ============================================
-- Execute estas queries após aplicar o script para validar:

-- Verificar se tabela foi criada
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name = 'affiliate_referrals';

-- Listar todas as colunas da tabela
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'affiliate_referrals'
-- ORDER BY ordinal_position;

-- Listar índices criados
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'affiliate_referrals';

-- Verificar foreign keys
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- AND tc.table_name = 'affiliate_referrals';

-- Verificar triggers
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'affiliate_referrals';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
