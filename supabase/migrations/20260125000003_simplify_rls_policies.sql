-- ============================================
-- MIGRAÇÃO: Simplificar Políticas RLS
-- ============================================
-- Data: 2026-01-25
-- Objetivo: Remover verificação de status='ativo' das políticas RLS
-- Justificativa: No Payment First Flow, contas só existem se pagamento confirmado
-- Requirements: 3.5, 9.1

-- Backup das políticas atuais (comentadas para referência)
/*
POLÍTICAS ANTIGAS QUE SERÃO SUBSTITUÍDAS:

1. Profiles - SELECT: Usuários podem ver apenas perfis ativos
2. Profiles - UPDATE: Usuários podem atualizar apenas se ativo
3. User_subscriptions - SELECT: Apenas assinaturas de usuários ativos
4. Asaas_cobrancas - SELECT: Apenas cobranças de usuários ativos
*/

-- ============================================
-- PROFILES - Simplificar Políticas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own active profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Novas políticas simplificadas
-- Usuários podem ver seu próprio perfil (sem verificação de status)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil (sem verificação de status)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem atualizar todos os perfis
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem inserir perfis (para migração)
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- USER_SUBSCRIPTIONS - Simplificar Políticas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own active subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;

-- Novas políticas simplificadas
-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem gerenciar assinaturas
CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Sistema pode inserir assinaturas (para Edge Functions)
CREATE POLICY "System can insert subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- ASAAS_COBRANCAS - Simplificar Políticas
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own active charges" ON asaas_cobrancas;
DROP POLICY IF EXISTS "Users can view own charges" ON asaas_cobrancas;

-- Novas políticas simplificadas
-- Usuários podem ver suas próprias cobranças
CREATE POLICY "Users can view own charges" ON asaas_cobrancas
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = customer_email
    )
  );

-- Admins podem ver todas as cobranças
CREATE POLICY "Admins can view all charges" ON asaas_cobrancas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem gerenciar cobranças
CREATE POLICY "Admins can manage charges" ON asaas_cobrancas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Sistema pode inserir cobranças (para webhooks)
CREATE POLICY "System can insert charges" ON asaas_cobrancas
  FOR INSERT WITH CHECK (true);

-- ============================================
-- SOLICITACOES_SERVICOS - Simplificar Políticas
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own active service requests" ON solicitacoes_servicos;
DROP POLICY IF EXISTS "Users can view own service requests" ON solicitacoes_servicos;

-- Novas políticas simplificadas
-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view own service requests" ON solicitacoes_servicos
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar solicitações
CREATE POLICY "Users can create service requests" ON solicitacoes_servicos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias solicitações (apenas alguns campos)
CREATE POLICY "Users can update own service requests" ON solicitacoes_servicos
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem gerenciar todas as solicitações
CREATE POLICY "Admins can manage all service requests" ON solicitacoes_servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- CARTEIRAS_DIGITAIS - Simplificar Políticas
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own active digital wallets" ON carteiras_digitais;
DROP POLICY IF EXISTS "Users can view own digital wallets" ON carteiras_digitais;

-- Novas políticas simplificadas
-- Usuários podem ver suas próprias carteiras
CREATE POLICY "Users can view own digital wallets" ON carteiras_digitais
  FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todas as carteiras
CREATE POLICY "Admins can view all digital wallets" ON carteiras_digitais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role IN ('admin', 'super_admin')
    )
  );

-- Sistema pode gerenciar carteiras (para geração automática)
CREATE POLICY "System can manage digital wallets" ON carteiras_digitais
  FOR ALL WITH CHECK (true);

-- ============================================
-- AFFILIATES - Manter Políticas Existentes
-- ============================================
-- As políticas de afiliados já estão corretas e não dependem de status

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

-- Adicionar comentários explicativos
COMMENT ON POLICY "Users can view own profile" ON profiles IS 
'Usuários podem ver seu próprio perfil. Verificação de status removida pois no Payment First Flow contas só existem se pagamento confirmado.';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
'Usuários podem atualizar seu próprio perfil. Verificação de status removida pois no Payment First Flow contas só existem se pagamento confirmado.';

COMMENT ON POLICY "Users can view own subscriptions" ON user_subscriptions IS 
'Usuários podem ver suas próprias assinaturas. Verificação de status removida pois no Payment First Flow assinaturas só existem se pagamento confirmado.';

COMMENT ON POLICY "Users can view own charges" ON asaas_cobrancas IS 
'Usuários podem ver suas próprias cobranças. Verificação de status removida pois no Payment First Flow cobranças são criadas antes da conta.';

-- ============================================
-- FUNÇÃO PARA VERIFICAR INTEGRIDADE
-- ============================================

-- Função para verificar se há dados inconsistentes após a mudança
CREATE OR REPLACE FUNCTION check_payment_first_flow_integrity()
RETURNS TABLE(
  table_name TEXT,
  issue_type TEXT,
  count BIGINT,
  description TEXT
) AS $$
BEGIN
  -- Verificar perfis sem payment_confirmed_at (possível problema)
  RETURN QUERY
  SELECT 
    'profiles'::TEXT,
    'missing_payment_confirmation'::TEXT,
    COUNT(*)::BIGINT,
    'Perfis sem payment_confirmed_at (podem ser do fluxo antigo)'::TEXT
  FROM profiles 
  WHERE payment_confirmed_at IS NULL 
  AND created_at > '2026-01-01'::DATE;

  -- Verificar assinaturas sem asaas_payment_id
  RETURN QUERY
  SELECT 
    'user_subscriptions'::TEXT,
    'missing_payment_id'::TEXT,
    COUNT(*)::BIGINT,
    'Assinaturas sem asaas_payment_id (podem ser do fluxo antigo)'::TEXT
  FROM user_subscriptions 
  WHERE asaas_payment_id IS NULL 
  AND created_at > '2026-01-01'::DATE;

  -- Verificar cobranças pagas sem usuário correspondente
  RETURN QUERY
  SELECT 
    'asaas_cobrancas'::TEXT,
    'paid_without_user'::TEXT,
    COUNT(*)::BIGINT,
    'Cobranças pagas sem usuário correspondente (precisam migração)'::TEXT
  FROM asaas_cobrancas c
  WHERE c.status = 'RECEIVED' 
  AND NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.email = c.customer_email
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LOG DA MIGRAÇÃO
-- ============================================

-- Registrar a migração no log
INSERT INTO payment_first_flow_logs (
  event_type,
  user_email,
  context,
  metadata
) VALUES (
  'process_completed',
  'system',
  jsonb_build_object(
    'migration', 'rls_policies_simplified',
    'date', NOW(),
    'description', 'Políticas RLS simplificadas para Payment First Flow'
  ),
  jsonb_build_object(
    'tables_affected', ARRAY['profiles', 'user_subscriptions', 'asaas_cobrancas', 'solicitacoes_servicos', 'carteiras_digitais'],
    'reason', 'No Payment First Flow, contas só existem se pagamento confirmado, então verificação de status é redundante'
  )
);

-- Executar verificação de integridade
SELECT * FROM check_payment_first_flow_integrity();