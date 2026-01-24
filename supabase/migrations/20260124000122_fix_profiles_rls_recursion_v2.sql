-- Remover políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_safe" ON profiles;

-- Criar políticas sem recursão usando user_roles
CREATE POLICY "profiles_select_safe_v2" ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode ver seu próprio perfil
    auth.uid() = id OR
    -- Ou se for admin (usando user_roles para evitar recursão)
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
);

CREATE POLICY "profiles_update_safe_v2" ON profiles
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode editar seu próprio perfil
    auth.uid() = id OR
    -- Ou se for admin (usando user_roles para evitar recursão)
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
);

CREATE POLICY "profiles_delete_safe_v2" ON profiles
FOR DELETE USING (
  auth.uid() IS NOT NULL AND
  -- Apenas admin pode deletar (usando user_roles para evitar recursão)
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Política de INSERT (permite inserção para usuários autenticados)
CREATE POLICY "profiles_insert_safe_v2" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);;
