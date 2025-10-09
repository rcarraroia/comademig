-- ============================================================================
-- MIGRATION: Criar tabela servicos (unificada)
-- Data: 2025-01-09
-- Descrição: Tabela unificada para todos os serviços (certidões, regularização, outros)
-- ============================================================================

-- 1. Criar tabela servicos
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('certidao', 'regularizacao', 'outro')),
  prazo TEXT,
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  aceita_pix BOOLEAN DEFAULT true,
  aceita_cartao BOOLEAN DEFAULT true,
  max_parcelas INTEGER DEFAULT 1 CHECK (max_parcelas >= 1 AND max_parcelas <= 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_servicos_active ON servicos(is_active);
CREATE INDEX IF NOT EXISTS idx_servicos_sort ON servicos(categoria, sort_order);
CREATE INDEX IF NOT EXISTS idx_servicos_created_by ON servicos(created_by);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_servicos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_servicos_updated_at
  BEFORE UPDATE ON servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_servicos_updated_at();

-- 4. Adicionar comentários para documentação
COMMENT ON TABLE servicos IS 'Tabela unificada de serviços oferecidos pela COMADEMIG (certidões, regularização, etc)';
COMMENT ON COLUMN servicos.categoria IS 'Categoria do serviço: certidao, regularizacao ou outro';
COMMENT ON COLUMN servicos.prazo IS 'Prazo de entrega em texto livre (ex: 3-5 dias úteis)';
COMMENT ON COLUMN servicos.valor IS 'Valor do serviço em reais';
COMMENT ON COLUMN servicos.aceita_pix IS 'Se o serviço aceita pagamento via PIX';
COMMENT ON COLUMN servicos.aceita_cartao IS 'Se o serviço aceita pagamento via cartão de crédito';
COMMENT ON COLUMN servicos.max_parcelas IS 'Número máximo de parcelas permitidas (1-12)';
COMMENT ON COLUMN servicos.sort_order IS 'Ordem de exibição dentro da categoria';

-- 5. Validar que a tabela foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'servicos'
  ) THEN
    RAISE EXCEPTION 'Tabela servicos não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Tabela servicos criada com sucesso!';
END $$;
