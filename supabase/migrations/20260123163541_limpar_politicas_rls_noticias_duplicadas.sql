-- Remover políticas RLS duplicadas da tabela noticias
-- Manter apenas as essenciais para funcionamento

-- 1. Remover políticas antigas duplicadas
DROP POLICY IF EXISTS "Notícias ativas são visíveis publicamente" ON noticias;
DROP POLICY IF EXISTS "Admins podem ver todas as notícias" ON noticias;
DROP POLICY IF EXISTS "Apenas admins podem criar notícias" ON noticias;
DROP POLICY IF EXISTS "Apenas admins podem atualizar notícias" ON noticias;
DROP POLICY IF EXISTS "Apenas admins podem deletar notícias" ON noticias;

-- 2. Manter apenas as políticas funcionais (as que criei)
-- noticias_select_policy - permite ver notícias aprovadas publicamente
-- noticias_insert_policy - permite admins criarem
-- noticias_update_policy - permite admins atualizarem
-- noticias_delete_policy - permite admins deletarem

-- Verificar políticas restantes
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'noticias' ORDER BY policyname;;
