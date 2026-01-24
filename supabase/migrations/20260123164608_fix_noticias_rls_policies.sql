-- CORREÇÃO EMERGENCIAL: Simplificar políticas RLS da tabela noticias
-- Problema: Múltiplas políticas duplicadas causando erro 500
-- Solução: Manter apenas políticas essenciais

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "noticias_delete_policy" ON noticias;
DROP POLICY IF EXISTS "noticias_insert_policy" ON noticias;
DROP POLICY IF EXISTS "noticias_select_policy" ON noticias;
DROP POLICY IF EXISTS "noticias_update_policy" ON noticias;

-- 2. Criar políticas simplificadas e otimizadas

-- Política SELECT: Notícias aprovadas são públicas, autores e admins veem todas
CREATE POLICY "noticias_select_optimized" ON noticias
    FOR SELECT
    USING (
        (status = 'aprovado' AND ativo = true) OR
        (autor_id = auth.uid()) OR
        (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_membro IN ('admin', 'super_admin')
        ))
    );

-- Política INSERT: Usuários autenticados podem criar
CREATE POLICY "noticias_insert_optimized" ON noticias
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política UPDATE: Autores e admins podem editar
CREATE POLICY "noticias_update_optimized" ON noticias
    FOR UPDATE
    USING (
        (autor_id = auth.uid()) OR
        (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_membro IN ('admin', 'super_admin')
        ))
    );

-- Política DELETE: Autores e admins podem deletar
CREATE POLICY "noticias_delete_optimized" ON noticias
    FOR DELETE
    USING (
        (autor_id = auth.uid()) OR
        (EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_membro IN ('admin', 'super_admin')
        ))
    );;
