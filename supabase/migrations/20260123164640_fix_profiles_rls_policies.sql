-- CORREÇÃO EMERGENCIAL: Simplificar políticas RLS da tabela profiles
-- Problema: Recursão infinita com auth.jwt() -> app_metadata
-- Solução: Usar apenas verificação direta de tipo_membro

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- 2. Criar políticas simplificadas sem recursão

-- Política SELECT: Usuários veem próprio perfil, admins veem todos
CREATE POLICY "profiles_select_safe" ON profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = id OR
            -- Verificar admin via subconsulta simples
            EXISTS (
                SELECT 1 FROM profiles p2 
                WHERE p2.id = auth.uid() 
                AND p2.tipo_membro IN ('admin', 'super_admin')
                LIMIT 1
            )
        )
    );

-- Política INSERT: Permitir inserção (para registro)
CREATE POLICY "profiles_insert_safe" ON profiles
    FOR INSERT
    WITH CHECK (true); -- Sem restrição para permitir registro

-- Política UPDATE: Usuários editam próprio perfil, admins editam todos
CREATE POLICY "profiles_update_safe" ON profiles
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            auth.uid() = id OR
            -- Verificar admin via subconsulta simples
            EXISTS (
                SELECT 1 FROM profiles p2 
                WHERE p2.id = auth.uid() 
                AND p2.tipo_membro IN ('admin', 'super_admin')
                LIMIT 1
            )
        )
    );

-- Política DELETE: Apenas super_admin pode deletar (exceto outros super_admin)
CREATE POLICY "profiles_delete_safe" ON profiles
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.tipo_membro = 'super_admin'
            LIMIT 1
        ) AND
        tipo_membro != 'super_admin' -- Não pode deletar outros super_admin
    );;
