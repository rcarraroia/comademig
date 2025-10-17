-- ============================================
-- CORREÇÃO: Política INSERT para user_activity_log
-- ============================================
-- Data: 2025-10-15
-- Problema: Tabela user_activity_log não tinha política INSERT
-- Causa: Trigger audit_profiles falhava ao tentar inserir logs
-- Solução: Criar política INSERT que permite triggers do sistema
-- ============================================

-- Criar política INSERT para permitir triggers
CREATE POLICY "System can insert audit logs"
ON user_activity_log
FOR INSERT
WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar políticas criadas
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_activity_log'
ORDER BY cmd;

-- Resultado esperado:
-- Admins veem todos os logs | SELECT
-- System can insert audit logs | INSERT

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Após aplicar esta migração:
-- ✅ Signup funcionará normalmente
-- ✅ Trigger audit_profiles poderá inserir em user_activity_log
-- ✅ Logs de auditoria serão criados corretamente
-- ✅ Sem erro "Database error saving new user"
