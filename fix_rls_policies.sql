-- CORREÇÃO CIRÚRGICA: Apenas para content_management sem quebrar outras tabelas

-- ========================================
-- 1. CORRIGIR APENAS O TRIGGER PROBLEMÁTICO
-- ========================================

-- Remover APENAS o trigger problemático da tabela content_management
DROP TRIGGER IF EXISTS update_content_management_updated_at ON public.content_management;

-- CORRIGIR a função existente para lidar com content_management corretamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Para tabela content_management, usar last_updated_at (campo correto)
  IF TG_TABLE_NAME = 'content_management' THEN
    NEW.last_updated_at = now();
  -- Para outras tabelas, usar updated_at (como estava funcionando)
  ELSE
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger para content_management com a função corrigida
CREATE TRIGGER update_content_management_updated_at
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. CORRIGIR POLÍTICAS RLS
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage content" ON public.content_management;
DROP POLICY IF EXISTS "Public can read content" ON public.content_management;
DROP POLICY IF EXISTS "Authenticated users can read content" ON public.content_management;
DROP POLICY IF EXISTS "Admins can update content" ON public.content_management;
DROP POLICY IF EXISTS "Temporary anon update for debug" ON public.content_management;

-- Política para leitura pública (qualquer um pode ler)
CREATE POLICY "Public can read content" ON public.content_management
FOR SELECT TO anon, authenticated
USING (true);

-- Política para admins gerenciarem conteúdo (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage content" ON public.content_management
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- 3. TESTAR A CORREÇÃO
-- ========================================

-- Testar se o trigger funciona (deve usar last_updated_at agora)
UPDATE public.content_management 
SET content_json = '{"test": "trigger_funcionando"}' 
WHERE page_name = 'home';

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'content_management';

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
-- 1. Execute este script completo no painel do Supabase
-- 2. Teste o gerenciador de conteúdo no frontend
-- 3. Verifique se não há mais erros no console
-- 4. O sistema deve salvar o conteúdo corretamente