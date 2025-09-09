-- ============================================================================
-- MIGRAÇÃO: SISTEMA DE NOTIFICAÇÕES ADMINISTRATIVAS
-- Data: 08/09/2025
-- Objetivo: Criar tabela para notificações administrativas
-- ============================================================================

-- 1. CRIAR TABELA DE NOTIFICAÇÕES ADMINISTRATIVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    category TEXT NOT NULL CHECK (category IN ('payment', 'subscription', 'system', 'user_action')),
    service_type TEXT CHECK (service_type IN ('filiacao', 'certidao', 'regularizacao')),
    reference_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para buscar notificações não lidas
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read 
ON public.admin_notifications(read, created_at DESC);

-- Índice para buscar por tipo
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type 
ON public.admin_notifications(type, created_at DESC);

-- Índice para buscar por categoria
CREATE INDEX IF NOT EXISTS idx_admin_notifications_category 
ON public.admin_notifications(category, created_at DESC);

-- Índice para buscar por tipo de serviço
CREATE INDEX IF NOT EXISTS idx_admin_notifications_service_type 
ON public.admin_notifications(service_type, created_at DESC);

-- Índice para buscar por referência
CREATE INDEX IF NOT EXISTS idx_admin_notifications_reference 
ON public.admin_notifications(reference_id);

-- Índice para buscar por usuário
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user 
ON public.admin_notifications(user_id, created_at DESC);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read_category 
ON public.admin_notifications(read, category, created_at DESC);

-- 3. CRIAR TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_admin_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_notifications_updated_at
    BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admin_notifications_updated_at();

-- 4. CRIAR POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política para administradores lerem todas as notificações
CREATE POLICY "Admins can read all admin notifications" ON public.admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Política para administradores criarem notificações
CREATE POLICY "Admins can create admin notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Política para administradores atualizarem notificações
CREATE POLICY "Admins can update admin notifications" ON public.admin_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Política para administradores deletarem notificações
CREATE POLICY "Admins can delete admin notifications" ON public.admin_notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- 5. CRIAR FUNÇÃO PARA CRIAR NOTIFICAÇÃO AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_admin_notification(
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'info',
    p_category TEXT DEFAULT 'system',
    p_service_type TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Validar parâmetros
    IF p_title IS NULL OR p_title = '' THEN
        RAISE EXCEPTION 'Title cannot be empty';
    END IF;
    
    IF p_message IS NULL OR p_message = '' THEN
        RAISE EXCEPTION 'Message cannot be empty';
    END IF;
    
    IF p_type NOT IN ('info', 'success', 'warning', 'error') THEN
        RAISE EXCEPTION 'Invalid notification type';
    END IF;
    
    IF p_category NOT IN ('payment', 'subscription', 'system', 'user_action') THEN
        RAISE EXCEPTION 'Invalid notification category';
    END IF;
    
    -- Inserir notificação
    INSERT INTO public.admin_notifications (
        title,
        message,
        type,
        category,
        service_type,
        reference_id,
        user_id,
        metadata
    ) VALUES (
        p_title,
        p_message,
        p_type,
        p_category,
        p_service_type,
        p_reference_id,
        p_user_id,
        p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 6. CRIAR FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE NOTIFICAÇÕES ANTIGAS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_admin_notifications(
    days_to_keep INTEGER DEFAULT 90
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar notificações lidas mais antigas que o período especificado
    DELETE FROM public.admin_notifications 
    WHERE read = TRUE 
    AND created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- 7. INSERIR NOTIFICAÇÕES DE EXEMPLO (OPCIONAL)
-- ============================================================================

-- Inserir algumas notificações de exemplo para teste
INSERT INTO public.admin_notifications (title, message, type, category, service_type) VALUES
('Sistema Inicializado', 'Sistema de notificações administrativas foi configurado com sucesso.', 'success', 'system', NULL),
('Configuração Completa', 'Todas as tabelas e políticas foram criadas corretamente.', 'info', 'system', NULL);

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.admin_notifications IS 'Notificações administrativas do sistema';
COMMENT ON COLUMN public.admin_notifications.title IS 'Título da notificação';
COMMENT ON COLUMN public.admin_notifications.message IS 'Mensagem detalhada da notificação';
COMMENT ON COLUMN public.admin_notifications.type IS 'Tipo da notificação: info, success, warning, error';
COMMENT ON COLUMN public.admin_notifications.category IS 'Categoria: payment, subscription, system, user_action';
COMMENT ON COLUMN public.admin_notifications.service_type IS 'Tipo de serviço relacionado: filiacao, certidao, regularizacao';
COMMENT ON COLUMN public.admin_notifications.reference_id IS 'ID de referência (cobrança, assinatura, etc.)';
COMMENT ON COLUMN public.admin_notifications.user_id IS 'ID do usuário relacionado à notificação';
COMMENT ON COLUMN public.admin_notifications.read IS 'Se a notificação foi lida';
COMMENT ON COLUMN public.admin_notifications.metadata IS 'Dados adicionais em formato JSON';

COMMENT ON FUNCTION public.create_admin_notification IS 'Função para criar notificações administrativas';
COMMENT ON FUNCTION public.cleanup_old_admin_notifications IS 'Função para limpeza de notificações antigas';

-- 9. VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se a tabela foi criada
SELECT 
    'Tabela admin_notifications criada com sucesso!' as status,
    COUNT(*) as total_notifications
FROM public.admin_notifications;

-- Verificar índices criados
SELECT 
    'Índices criados:' as info;

SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'admin_notifications' 
AND schemaname = 'public';

-- Verificar políticas RLS
SELECT 
    'Políticas RLS criadas:' as info;

SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'admin_notifications' 
AND schemaname = 'public';

-- 10. MENSAGEM FINAL
-- ============================================================================

SELECT 
    '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as resultado,
    '✅ Tabela admin_notifications criada' as item_1,
    '✅ Índices de performance criados' as item_2,
    '✅ Políticas RLS configuradas' as item_3,
    '✅ Funções auxiliares criadas' as item_4,
    '✅ Triggers de atualização configurados' as item_5,
    '🚀 Sistema de notificações administrativas pronto!' as proximo_passo;