-- ============================================
-- CORREÇÃO CRÍTICA: RLS da Tabela Profiles
-- ============================================
-- Data: 2025-10-14
-- Severidade: 🔴 CRÍTICA (Violação LGPD)
-- Problema: Tabela profiles acessível sem autenticação
-- Solução: Implementar políticas RLS restritivas
--
-- ANÁLISE PRÉVIA REALIZADA:
-- - Tabela existe com 3 registros
-- - Dados sensíveis expostos: CPF, RG, endereço, telefone
-- - 17 arquivos no código acessam esta tabela
-- - Funcionalidades afetadas: Login, Filiação, Dashboard, Admin
--
-- POLÍTICAS ATUAIS (PERMISSIVAS):
-- 1. "Enable read access for authenticated users" - Permite qualquer autenticado ver tudo
-- 2. "Enable insert for authenticated users" - Permite criar perfil para qualquer ID
-- 3. "Enable update for users based on user_id" - Correta, mas será recriada
--
-- NOVAS POLÍTICAS (RESTRITIVAS):
-- 1. "Users can view own profile" - Usuário vê apenas próprio perfil
-- 2. "Admins can view all profiles" - Admin vê todos
-- 3. "Users can insert own profile" - Usuário cria apenas próprio perfil
-- 4. "Users can update own profile" - Usuário atualiza apenas próprio perfil
-- 5. "Admins can update all profiles" - Admin atualiza qualquer perfil
--
-- ROLLBACK: Ver arquivo PROFILES_RLS_PLANO.md
-- ============================================

-- IMPORTANTE: Este script deve ser executado em TRANSAÇÃO
-- BEGIN; (executar manualmente)

-- ============================================
-- PASSO 1: REMOVER POLÍTICAS PERMISSIVAS
-- ============================================

-- Remover política que permite qualquer autenticado ver todos os perfis
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- Remover política que permite criar perfil para qualquer ID
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Remover política de update (será recriada com mesmo comportamento)
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Remover possíveis políticas antigas que podem estar causando o problema
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================
-- PASSO 2: CRIAR POLÍTICAS RESTRITIVAS
-- ============================================

-- POLÍTICA 1: Usuário pode ver APENAS próprio perfil
-- Lógica: auth.uid() (ID do usuário logado) = id (ID do registro)
-- Resultado: Cada usuário vê apenas sua própria linha
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- POLÍTICA 2: Admin pode ver TODOS os perfis
-- Lógica: Verifica se usuário logado tem tipo_membro = 'admin' ou 'super_admin'
-- Resultado: Se for admin, vê todos os registros
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- POLÍTICA 3: Usuário pode criar APENAS próprio perfil
-- Lógica: WITH CHECK valida que ID do novo registro = ID do usuário logado
-- Resultado: Impede criar perfil para outro usuário
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- POLÍTICA 4: Usuário pode atualizar APENAS próprio perfil
-- Lógica: USING encontra registro, WITH CHECK valida após atualização
-- Resultado: Dupla proteção - só encontra e só atualiza próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLÍTICA 5: Admin pode atualizar QUALQUER perfil
-- Lógica: Verifica se quem está atualizando é admin/super_admin
-- Resultado: Admin pode modificar dados de qualquer usuário (necessário para administração)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tipo_membro IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PASSO 3: GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

-- Habilitar RLS na tabela (se já estiver habilitado, não faz nada)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VALIDAÇÃO OBRIGATÓRIA ANTES DE COMMIT
-- ============================================

-- ATENÇÃO: NÃO FAÇA COMMIT AINDA!
-- Execute os testes abaixo ANTES de fazer COMMIT:

-- TESTE 1: Usuário não autenticado NÃO deve ver nada
-- SET ROLE anon;
-- SELECT COUNT(*) FROM profiles; -- Esperado: 0 ou erro

-- TESTE 2: Usuário comum vê APENAS próprio perfil
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"474d62fe-d9b9-4e90-88f9-e0b0beb44042"}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 1
-- SELECT COUNT(*) FROM profiles WHERE id = '474d62fe-d9b9-4e90-88f9-e0b0beb44042'; -- Esperado: 1
-- SELECT COUNT(*) FROM profiles WHERE id != '474d62fe-d9b9-4e90-88f9-e0b0beb44042'; -- Esperado: 0

-- TESTE 3: Admin vê TODOS os perfis
-- SET ROLE authenticated;
-- SELECT set_config('request.jwt.claims', '{"sub":"c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a"}', true);
-- SELECT COUNT(*) FROM profiles; -- Esperado: 3 (todos)

-- SE TODOS OS TESTES PASSAREM:
-- COMMIT;

-- SE QUALQUER TESTE FALHAR:
-- ROLLBACK;

-- ============================================
-- SCRIPT DE ROLLBACK (SE NECESSÁRIO)
-- ============================================

-- Se algo quebrar após COMMIT, execute:
/*
BEGIN;

-- Remover políticas novas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Restaurar políticas antigas (ATENÇÃO: Isso volta a expor os dados!)
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

COMMIT;
*/

-- ============================================
-- FIM DO SCRIPT
-- ============================================
