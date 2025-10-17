-- ============================================================================
-- MIGRATION: Criar tabela servico_exigencias
-- Data: 2025-01-09
-- Descrição: Tabela para configurar exigências/documentos de cada serviço
-- ============================================================================

-- 1. Criar tabela servico_exigencias
CREATE TABLE IF NOT EXISTS servico_exigencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('documento', 'campo_texto', 'campo_numero', 'campo_data', 'campo_select')),
  nome TEXT NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  opcoes JSONB, -- Para campos select: ["opcao1", "opcao2"]
  validacao JSONB, -- Regras de validação: {"min": 10, "max": 100, "pattern": "regex"}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_exigencias_servico ON servico_exigencias(servico_id);
CREATE INDEX IF NOT EXISTS idx_exigencias_ordem ON servico_exigencias(servico_id, ordem);

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE servico_exigencias IS 'Exigências e documentos necessários para cada serviço';
COMMENT ON COLUMN servico_exigencias.tipo IS 'Tipo de exigência: documento (upload), campo_texto, campo_numero, campo_data, campo_select';
COMMENT ON COLUMN servico_exigencias.nome IS 'Nome da exigência (ex: RG, CPF, Justificativa)';
COMMENT ON COLUMN servico_exigencias.descricao IS 'Descrição/instruções para o usuário';
COMMENT ON COLUMN servico_exigencias.obrigatorio IS 'Se o campo é obrigatório';
COMMENT ON COLUMN servico_exigencias.ordem IS 'Ordem de exibição no formulário';
COMMENT ON COLUMN servico_exigencias.opcoes IS 'Opções para campos select (array JSON)';
COMMENT ON COLUMN servico_exigencias.validacao IS 'Regras de validação (objeto JSON com min, max, pattern, etc)';

-- 4. Validar que a tabela foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'servico_exigencias'
  ) THEN
    RAISE EXCEPTION 'Tabela servico_exigencias não foi criada!';
  END IF;
  
  RAISE NOTICE '✅ Tabela servico_exigencias criada com sucesso!';
END $$;
