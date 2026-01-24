-- ============================================
-- FIX: Políticas RLS para Solicitações e Cobranças
-- ============================================
-- Garantir que admins vejam tudo e usuários vejam apenas seus dados

-- ============================================
-- TABELA: asaas_cobrancas
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can view all cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can view own cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "System can insert cobrancas" ON asaas_cobrancas;
DROP POLICY IF EXISTS "System can update cobrancas" ON asaas_cobrancas;
-- Habilitar RLS
ALTER TABLE asaas_cobrancas ENABLE ROW LEVEL SECURITY;
-- Política: Admins podem ver TODAS as cobranças
CREATE POLICY "Admins can view all cobrancas"
ON asaas_cobrancas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);
-- Política: Usuários podem ver apenas suas cobranças
CREATE POLICY "Users can view own cobrancas"
ON asaas_cobrancas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
-- Política: Sistema pode inserir cobranças (authenticated users)
CREATE POLICY "System can insert cobrancas"
ON asaas_cobrancas
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
-- Política: Sistema pode atualizar cobranças
CREATE POLICY "System can update cobrancas"
ON asaas_cobrancas
FOR UPDATE
TO authenticated
USING (true);
-- Webhooks precisam atualizar

-- ============================================
-- TABELA: solicitacoes_servicos
-- ============================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can view all solicitacoes" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "System can insert solicitacoes" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Admins can update solicitacoes" ON solicitacoes_servicos;
-- Habilitar RLS
ALTER TABLE solicitacoes_servicos ENABLE ROW LEVEL SECURITY;
-- Política: Admins podem ver TODAS as solicitações
CREATE POLICY "Admins can view all solicitacoes"
ON solicitacoes_servicos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);
-- Política: Usuários podem ver apenas suas solicitações
CREATE POLICY "Users can view own solicitacoes"
ON solicitacoes_servicos
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
-- Política: Sistema pode inserir solicitações (webhooks)
CREATE POLICY "System can insert solicitacoes"
ON solicitacoes_servicos
FOR INSERT
TO authenticated
WITH CHECK (true);
-- Webhooks precisam inserir

-- Política: Admins podem atualizar solicitações
CREATE POLICY "Admins can update solicitacoes"
ON solicitacoes_servicos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);
-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Comentário para documentação
COMMENT ON TABLE asaas_cobrancas IS 'Cobranças do Asaas - Admins veem todas, usuários veem apenas suas';
COMMENT ON TABLE solicitacoes_servicos IS 'Solicitações de serviços - Admins veem todas, usuários veem apenas suas';
