-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-10
-- Tabelas a criar: split_configurations, split_recipients
-- Status atual: Tabelas NÃO EXISTEM (verificado)
-- Impacto: Criação de novas tabelas para gestão de configurações de split (não destrutivo)
-- Verificações:
--   ✅ Nenhuma tabela com nome similar existe
--   ✅ Nenhum dado será perdido
--   ✅ Estrutura independente de outras tabelas
-- ============================================

-- ============================================
-- CRIAÇÃO DAS TABELAS DE CONFIGURAÇÃO DE SPLIT
-- ============================================
-- Estas tabelas permitem configurar de forma centralizada
-- como os pagamentos são divididos entre beneficiários
-- ============================================

-- ============================================
-- 1. TABELA split_configurations
-- ============================================
-- Armazena as categorias de receita e suas configurações

CREATE TABLE IF NOT EXISTS split_configurations (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Categoria de receita (chave única)
  category TEXT NOT NULL UNIQUE,
  
  -- Label amigável para exibição
  category_label TEXT NOT NULL,
  
  -- Descrição da categoria
  description TEXT,
  
  -- Status ativo/inativo
  is_active BOOLEAN DEFAULT true NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. TABELA split_recipients
-- ============================================
-- Armazena os beneficiários de cada categoria de receita

CREATE TABLE IF NOT EXISTS split_recipients (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento com configuração
  configuration_id UUID NOT NULL REFERENCES split_configurations(id) ON DELETE CASCADE,
  
  -- Tipo de beneficiário (fixo ou dinâmico)
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('fixed', 'dynamic')),
  
  -- Nome do beneficiário
  recipient_name TEXT NOT NULL,
  
  -- Identificador do beneficiário (comademig, renum, affiliate)
  recipient_identifier TEXT NOT NULL,
  
  -- Wallet ID do Asaas (NULL para COMADEMIG)
  wallet_id TEXT,
  
  -- Percentual do split
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  
  -- Ordem de exibição
  sort_order INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para buscar recipients por configuração
CREATE INDEX IF NOT EXISTS idx_split_recipients_config 
ON split_recipients(configuration_id);

-- Índice para buscar por identificador
CREATE INDEX IF NOT EXISTS idx_split_recipients_identifier 
ON split_recipients(recipient_identifier);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_split_recipients_sort 
ON split_recipients(configuration_id, sort_order);

-- Índice para buscar configurações ativas
CREATE INDEX IF NOT EXISTS idx_split_configurations_active 
ON split_configurations(is_active);

-- ============================================
-- 4. TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_split_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_split_configurations_updated_at
  BEFORE UPDATE ON split_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_split_configurations_updated_at();

-- ============================================
-- 5. COMENTÁRIOS NAS TABELAS E COLUNAS
-- ============================================

COMMENT ON TABLE split_configurations IS 'Configurações de divisão de pagamentos por categoria de receita';
COMMENT ON COLUMN split_configurations.category IS 'Chave única da categoria (ex: filiacao, servicos, publicidade)';
COMMENT ON COLUMN split_configurations.category_label IS 'Nome amigável para exibição na interface';
COMMENT ON COLUMN split_configurations.is_active IS 'Indica se a configuração está ativa';

COMMENT ON TABLE split_recipients IS 'Beneficiários de cada categoria de receita com seus percentuais';
COMMENT ON COLUMN split_recipients.recipient_type IS 'Tipo: fixed (COMADEMIG, RENUM) ou dynamic (Afiliado)';
COMMENT ON COLUMN split_recipients.recipient_name IS 'Nome do beneficiário para exibição';
COMMENT ON COLUMN split_recipients.recipient_identifier IS 'Identificador: comademig, renum, affiliate';
COMMENT ON COLUMN split_recipients.wallet_id IS 'Wallet ID do Asaas (NULL para COMADEMIG que recebe direto)';
COMMENT ON COLUMN split_recipients.percentage IS 'Percentual do split (ex: 40.00 para 40%)';
COMMENT ON COLUMN split_recipients.sort_order IS 'Ordem de exibição na interface';

-- ============================================
-- 6. POPULAR COM CONFIGURAÇÕES INICIAIS
-- ============================================

-- Configuração para Filiação (40% COMADEMIG, 40% RENUM, 20% Afiliado)
INSERT INTO split_configurations (category, category_label, description, is_active)
VALUES 
  ('filiacao', 'Filiação', 'Pagamentos de filiação e anuidades', true)
ON CONFLICT (category) DO NOTHING;

-- Configuração para Serviços (60% COMADEMIG, 40% RENUM)
INSERT INTO split_configurations (category, category_label, description, is_active)
VALUES 
  ('servicos', 'Serviços', 'Certidões, regularização e outros serviços', true)
ON CONFLICT (category) DO NOTHING;

-- Configuração para Publicidade (100% COMADEMIG)
INSERT INTO split_configurations (category, category_label, description, is_active)
VALUES 
  ('publicidade', 'Publicidade', 'Receitas de publicidade e patrocínios', true)
ON CONFLICT (category) DO NOTHING;

-- Buscar IDs das configurações criadas
DO $$
DECLARE
  filiacao_id UUID;
  servicos_id UUID;
  publicidade_id UUID;
BEGIN
  -- Buscar ID da configuração de filiação
  SELECT id INTO filiacao_id FROM split_configurations WHERE category = 'filiacao';
  
  -- Inserir beneficiários para filiação
  IF filiacao_id IS NOT NULL THEN
    INSERT INTO split_recipients (configuration_id, recipient_type, recipient_name, recipient_identifier, wallet_id, percentage, sort_order)
    VALUES 
      (filiacao_id, 'fixed', 'COMADEMIG', 'comademig', NULL, 40.00, 1),
      (filiacao_id, 'fixed', 'RENUM', 'renum', NULL, 40.00, 2),
      (filiacao_id, 'dynamic', 'Afiliado', 'affiliate', NULL, 20.00, 3)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Buscar ID da configuração de serviços
  SELECT id INTO servicos_id FROM split_configurations WHERE category = 'servicos';
  
  -- Inserir beneficiários para serviços
  IF servicos_id IS NOT NULL THEN
    INSERT INTO split_recipients (configuration_id, recipient_type, recipient_name, recipient_identifier, wallet_id, percentage, sort_order)
    VALUES 
      (servicos_id, 'fixed', 'COMADEMIG', 'comademig', NULL, 60.00, 1),
      (servicos_id, 'fixed', 'RENUM', 'renum', NULL, 40.00, 2)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Buscar ID da configuração de publicidade
  SELECT id INTO publicidade_id FROM split_configurations WHERE category = 'publicidade';
  
  -- Inserir beneficiários para publicidade
  IF publicidade_id IS NOT NULL THEN
    INSERT INTO split_recipients (configuration_id, recipient_type, recipient_name, recipient_identifier, wallet_id, percentage, sort_order)
    VALUES 
      (publicidade_id, 'fixed', 'COMADEMIG', 'comademig', NULL, 100.00, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 7. QUERIES DE VALIDAÇÃO
-- ============================================
-- Execute estas queries após aplicar o script para validar:

-- Verificar se tabelas foram criadas
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('split_configurations', 'split_recipients');

-- Listar configurações criadas
-- SELECT * FROM split_configurations ORDER BY category;

-- Listar beneficiários por configuração
-- SELECT 
--   sc.category,
--   sc.category_label,
--   sr.recipient_name,
--   sr.recipient_identifier,
--   sr.percentage,
--   sr.sort_order
-- FROM split_configurations sc
-- JOIN split_recipients sr ON sr.configuration_id = sc.id
-- ORDER BY sc.category, sr.sort_order;

-- Verificar soma de percentuais por configuração (deve ser 100%)
-- SELECT 
--   sc.category,
--   SUM(sr.percentage) as total_percentage
-- FROM split_configurations sc
-- JOIN split_recipients sr ON sr.configuration_id = sc.id
-- GROUP BY sc.category;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
