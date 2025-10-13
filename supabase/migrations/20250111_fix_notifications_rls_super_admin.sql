-- ============================================
-- ANÁLISE PRÉVIA REALIZADA
-- ============================================
-- Data: 2025-01-11
-- Problema: Política RLS de INSERT em 'notifications' só permite 'admin', não 'super_admin'
-- Erro: "new row violates row-level security policy"
-- Usuário afetado: super_admin não consegue criar notificações
-- Impacto: Apenas EXPANDE permissões (não remove nada)
-- Verificações:
--   ✅ Política atual verificada via pg_policies
--   ✅ Usuário tem tipo_membro = 'super_admin'
--   ✅ Política só aceita tipo_membro = 'admin'
--   ✅ Outras tabelas (admin_notifications, payment_notifications) não serão afetadas
--   ✅ Apenas política de INSERT será alterada
--   ✅ SELECT, UPDATE, DELETE permanecem inalterados
-- ============================================

-- Dropar política antiga que só permite 'admin'
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

-- Criar política nova que permite 'admin' E 'super_admin'
CREATE POLICY "Admins can create notifications" 
ON public.notifications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_membro IN ('admin', 'super_admin')
    )
);

-- Validação: Verificar que política foi criada corretamente
DO $$
DECLARE
    policy_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Admins can create notifications'
        AND cmd = 'INSERT'
    ) INTO policy_exists;
    
    IF policy_exists THEN
        RAISE NOTICE '✅ Política "Admins can create notifications" recriada com sucesso';
        RAISE NOTICE '✅ Agora aceita tanto admin quanto super_admin';
    ELSE
        RAISE WARNING '⚠️ Política não foi criada corretamente';
    END IF;
END $$;

-- Comentário explicativo
COMMENT ON POLICY "Admins can create notifications" ON public.notifications IS 
'Permite que usuários com tipo_membro = admin ou super_admin criem notificações para qualquer usuário';

-- Mensagem final
SELECT 
    '🎉 POLÍTICA RLS CORRIGIDA COM SUCESSO!' as resultado,
    '✅ super_admin agora pode criar notificações' as correcao_1,
    '✅ admin continua podendo criar notificações' as correcao_2,
    '✅ Usuários comuns continuam sem permissão' as seguranca,
    '🚀 Sistema de notificações funcionando!' as status;
