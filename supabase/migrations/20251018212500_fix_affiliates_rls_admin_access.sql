-- ============================================
-- FIX: Políticas RLS para Affiliates
-- ============================================
-- Garantir que admins possam ver todos os afiliados
-- e usuários possam ver apenas seus próprios dados

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Admins can view all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Users can view own affiliate" ON affiliates;
DROP POLICY IF EXISTS "Users can insert own affiliate" ON affiliates;
DROP POLICY IF EXISTS "Users can update own affiliate" ON affiliates;

-- Habilitar RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver TODOS os afiliados
CREATE POLICY "Admins can view all affiliates"
ON affiliates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);

-- Política: Usuários podem ver apenas seu próprio cadastro
CREATE POLICY "Users can view own affiliate"
ON affiliates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: Usuários podem criar seu próprio cadastro
CREATE POLICY "Users can insert own affiliate"
ON affiliates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar seu próprio cadastro
CREATE POLICY "Users can update own affiliate"
ON affiliates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Admins podem atualizar qualquer afiliado (para aprovar/suspender)
CREATE POLICY "Admins can update any affiliate"
ON affiliates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.tipo_membro IN ('admin', 'super_admin')
  )
);
