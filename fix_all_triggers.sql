-- SCRIPT COMPLETO PARA CORRIGIR TODOS OS TRIGGERS PROBLEMÁTICOS

-- ========================================
-- 1. IDENTIFICAR E REMOVER TODOS OS TRIGGERS PROBLEMÁTICOS
-- ========================================

-- Listar todos os triggers na tabela content_management
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'content_management';

-- Remover TODOS os triggers existentes na tabela content_management
DROP TRIGGER IF EXISTS update_content_management_timestamp ON public.content_management;
DROP TRIGGER IF EXISTS update_updated_at ON public.content_management;
DROP TRIGGER IF EXISTS set_updated_at ON public.content_management;
DROP TRIGGER IF EXISTS update_content_updated_at ON public.content_management;
DROP TRIGGER IF EXISTS content_management_updated_at ON public.content_management;

-- Remover TODAS as funções problemáticas
DROP FUNCTION IF EXISTS update_content_timestamp();
DROP FUNCTION IF EXISTS update_content_management_timestamp();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS set_updated_at();

-- ========================================
-- 2. CRIAR FUNÇÃO CORRETA
-- ========================================

CREATE OR REPLACE FUNCTION update_content_management_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Usar o campo correto da tabela: last_updated_at
  NEW.last_updated_at = now();
  
  -- Definir quem fez a atualização (se autenticado)
  IF auth.uid() IS NOT NULL THEN
    NEW.last_updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. CRIAR TRIGGER CORRETO
-- ========================================

CREATE TRIGGER update_content_management_timestamp
  BEFORE UPDATE ON public.content_management
  FOR EACH ROW
  EXECUTE FUNCTION update_content_management_timestamp();

-- ========================================
-- 4. TESTAR SE FUNCIONA
-- ========================================

-- Teste simples
UPDATE public.content_management 
SET content_json = '{"test": "trigger_corrigido", "timestamp": "' || now() || '"}' 
WHERE page_name = 'home';

-- Verificar se foi atualizado
SELECT 
    page_name, 
    content_json,
    last_updated_at,
    last_updated_by
FROM public.content_management 
WHERE page_name = 'home';

-- ========================================
-- 5. VERIFICAR TRIGGERS ATIVOS
-- ========================================

SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'content_management';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Execute este script completo no painel do Supabase
-- 2. Verifique se não há erros
-- 3. Teste o gerenciador de conteúdo no frontend
-- 4. O erro "updated_at" deve desaparecer