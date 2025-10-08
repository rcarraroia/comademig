-- =====================================================
-- MIGRAÇÃO: Criar tabela de audit logs
-- Data: 08/01/2025
-- Descrição: Sistema de auditoria para rastrear ações administrativas
-- =====================================================

-- 1. Remover tabela se existir (para recriar limpa)
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 2. Criar tabela de audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- 6. Criar policy para visualização (apenas admins)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
  );

-- 7. Criar policy para inserção (qualquer usuário autenticado pode inserir)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. Adicionar comentários
COMMENT ON TABLE public.audit_logs IS 'Registro de auditoria de todas as ações administrativas';
COMMENT ON COLUMN public.audit_logs.id IS 'ID único do log';
COMMENT ON COLUMN public.audit_logs.user_id IS 'ID do usuário que executou a ação';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de ação: create, update, delete, login, etc';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Tipo de entidade afetada: user, profile, certidao, etc';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Valores antigos (para updates)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'Valores novos (para creates e updates)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'Endereço IP do usuário';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN public.audit_logs.created_at IS 'Data e hora da ação';

-- 9. Verificação final
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs'
  ) THEN
    RAISE NOTICE '✅ Tabela audit_logs criada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro: Tabela audit_logs não foi criada!';
  END IF;
END $$;
