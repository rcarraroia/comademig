-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTAR
-- Isso vai permitir acesso total às tabelas para diagnosticar

-- Desabilitar RLS nas tabelas problemáticas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 'RLS desabilitado temporariamente!' as resultado;