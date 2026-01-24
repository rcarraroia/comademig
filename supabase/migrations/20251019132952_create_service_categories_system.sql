-- ============================================
-- MIGRAÇÃO: Sistema de Categorias de Serviços
-- Data: 2025-10-19
-- Objetivo: Criar sistema flexível de categorias
-- ============================================

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Popular com categorias iniciais (APENAS 2 AUTORIZADAS)
INSERT INTO service_categories (code, name, description) VALUES
  ('certidao', 'Certidões', 'Emissão de certidões e documentos'),
  ('regularizacao', 'Regularização', 'Regularização de situação cadastral');
-- 3. Remover constraint CHECK de asaas_cobrancas
ALTER TABLE asaas_cobrancas
DROP CONSTRAINT IF EXISTS asaas_cobrancas_service_type_check;
-- NOTA: NÃO adicionar FK em asaas_cobrancas (tabela compartilhada entre módulos)

-- 4. Adicionar FK em servicos (tabela específica deste módulo)
ALTER TABLE servicos
ADD CONSTRAINT fk_categoria
FOREIGN KEY (categoria)
REFERENCES service_categories(code)
ON DELETE RESTRICT;
-- 5. Criar políticas RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
-- Todos podem ler categorias ativas
CREATE POLICY "Anyone can view active categories"
ON service_categories
FOR SELECT
USING (active = true);
-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage categories"
ON service_categories
FOR ALL
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
-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();
-- 7. Comentários
COMMENT ON TABLE service_categories IS 'Categorias gerenciáveis de serviços (não inclui filiação, eventos, taxas)';
COMMENT ON COLUMN service_categories.code IS 'Código único usado como FK (ex: certidao, regularizacao)';
COMMENT ON COLUMN service_categories.name IS 'Nome exibido na interface';
COMMENT ON COLUMN service_categories.active IS 'Se false, não aparece para usuários mas mantém integridade de dados';
