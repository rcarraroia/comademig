-- ============================================
-- CORREÇÃO URGENTE: Remover Políticas de Admin Temporariamente
-- ============================================
-- Data: 2025-10-14
-- Problema: Política de admin está permitindo acesso sem autenticação
-- Causa: auth.jwt() retorna NULL para não autenticados, permitindo acesso
-- Solução: Remover políticas de admin temporariamente
--
-- IMPACTO:
-- ✅ Dados protegidos: Usuários não autenticados bloqueados
-- ✅ Usuários comuns: Veem apenas próprio perfil
-- ❌ Admins: Não conseguirão ver todos os perfis via frontend
--    (Precisarão usar Edge Function com service_role key)
-- ============================================

-- BEGIN;

-- ============================================
-- REMOVER POLÍTICAS DE ADMIN PROBLEMÁTICAS
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- ============================================
-- VERIFICAR POLÍTICAS RESTANTES
-- ============================================

-- Após executar, verificar que apenas estas políticas existem:
-- 1. "Users can view own profile" - Usuário vê apenas próprio perfil
-- 2. "Users can insert own profile" - Usuário cria apenas próprio perfil
-- 3. "Users can update own profile" - Usuário atualiza apenas próprio perfil

-- Query para verificar:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- ✅ Usuário não autenticado: BLOQUEADO (0 registros)
-- ✅ Usuário comum: Vê apenas próprio perfil (1 registro)
-- ❌ Admin: Vê apenas próprio perfil (1 registro) - TEMPORÁRIO

-- ============================================
-- PRÓXIMOS PASSOS
-- ============================================

-- Para restaurar funcionalidade admin, precisamos:
-- OPÇÃO 1: Criar Edge Function que usa service_role key
-- OPÇÃO 2: Adicionar verificação explícita de autenticação na política
-- OPÇÃO 3: Usar função SECURITY DEFINER que não causa recursão

-- Por enquanto, prioridade é PROTEGER OS DADOS!

-- COMMIT;
