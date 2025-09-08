-- ============================================================================
-- MIGRAÇÃO: SISTEMA DE AUDITORIA E SEGURANÇA
-- Data: 08/09/2025
-- Objetivo: Criar sistema completo de auditoria e validações de segurança
-- ============================================================================

-- 1. CRIAR TABELA DE LOGS DE AUDITORIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. CRIAR TABELA DE TENTATIVAS DE SEGURANÇA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('failed_validation', 'suspicious_activity', 'rate_limit', 'invalid_access')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. CRIAR TABELA DE VALIDAÇÕES DE INTEGRIDADE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integrity_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    check_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    expected_value JSONB,
    actual_value JSONB,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON public.audit_logs(resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs(created_at DESC);

-- Índices para security_events
CREATE INDEX IF NOT EXISTS idx_security_events_user_id 
ON public.security_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type 
ON public.security_events(event_type, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_resolved 
ON public.security_events(resolved, created_at DESC);

-- Índices para integrity_checks
CREATE INDEX IF NOT EXISTS idx_integrity_checks_type 
ON public.integrity_checks(check_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integrity_checks_resource 
ON public.integrity_checks(resource_type, resource_id, created_at DESC);

-- 5. CRIAR POLÍTICAS RLS
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_checks ENABLE ROW LEVEL SECURITY;

-- Políticas para audit_logs
CREATE POLICY "Admins can read all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Users can read their own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para security_events
CREATE POLICY "Admins can manage security events" ON public.security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "System can insert security events" ON public.security_events
    FOR INSERT WITH CHECK (true);

-- Políticas para integrity_checks
CREATE POLICY "Admins can read integrity checks" ON public.integrity_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "System can insert integrity checks" ON public.integrity_checks
    FOR INSERT WITH CHECK (true);

-- 6. CRIAR FUNÇÕES DE AUDITORIA
-- ============================================================================

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Função para criar evento de segurança
CREATE OR REPLACE FUNCTION public.create_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id,
        event_type,
        severity,
        description,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_event_type,
        p_severity,
        p_description,
        p_metadata,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Função para verificação de integridade
CREATE OR REPLACE FUNCTION public.create_integrity_check(
    p_check_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_expected_value JSONB,
    p_actual_value JSONB,
    p_status TEXT,
    p_details TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    check_id UUID;
BEGIN
    INSERT INTO public.integrity_checks (
        check_type,
        resource_type,
        resource_id,
        expected_value,
        actual_value,
        status,
        details
    ) VALUES (
        p_check_type,
        p_resource_type,
        p_resource_id,
        p_expected_value,
        p_actual_value,
        p_status,
        p_details
    ) RETURNING id INTO check_id;
    
    RETURN check_id;
END;
$$;

-- 7. CRIAR FUNÇÕES DE LIMPEZA AUTOMÁTICA
-- ============================================================================

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
    days_to_keep INTEGER DEFAULT 365
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar logs mais antigos que o período especificado
    DELETE FROM public.audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Função para limpeza de eventos de segurança resolvidos
CREATE OR REPLACE FUNCTION public.cleanup_resolved_security_events(
    days_to_keep INTEGER DEFAULT 90
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar eventos resolvidos mais antigos que o período especificado
    DELETE FROM public.security_events 
    WHERE resolved = TRUE 
    AND resolved_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- 8. CRIAR TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================================

-- Função de trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    record_id TEXT;
BEGIN
    -- Tentar obter ID do registro
    BEGIN
        IF TG_OP = 'UPDATE' THEN
            record_id := COALESCE(NEW.id::TEXT, 'unknown');
        ELSIF TG_OP = 'DELETE' THEN
            record_id := COALESCE(OLD.id::TEXT, 'unknown');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        record_id := 'no_id_column';
    END;

    -- Inserir log de auditoria para operações de UPDATE e DELETE
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.create_audit_log(
            auth.uid(),
            'update',
            TG_TABLE_NAME,
            record_id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.create_audit_log(
            auth.uid(),
            'delete',
            TG_TABLE_NAME,
            record_id,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em tabelas críticas (apenas se as tabelas existirem)
DO $$
BEGIN
    -- Trigger para user_subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions' AND table_schema = 'public') THEN
        CREATE TRIGGER audit_user_subscriptions
            AFTER UPDATE OR DELETE ON public.user_subscriptions
            FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
    END IF;

    -- Trigger para asaas_cobrancas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asaas_cobrancas' AND table_schema = 'public') THEN
        CREATE TRIGGER audit_asaas_cobrancas
            AFTER UPDATE OR DELETE ON public.asaas_cobrancas
            FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
    END IF;
END $$;

-- 9. CRIAR VIEWS PARA RELATÓRIOS
-- ============================================================================

-- View para relatório de auditoria
CREATE OR REPLACE VIEW public.audit_report AS
SELECT 
    al.id,
    al.created_at,
    al.action,
    al.resource_type,
    al.resource_id,
    p.full_name as user_name,
    p.email as user_email,
    al.ip_address,
    CASE 
        WHEN al.old_values IS NOT NULL AND al.new_values IS NOT NULL THEN 'modified'
        WHEN al.old_values IS NULL AND al.new_values IS NOT NULL THEN 'created'
        WHEN al.old_values IS NOT NULL AND al.new_values IS NULL THEN 'deleted'
        ELSE 'other'
    END as operation_type
FROM public.audit_logs al
LEFT JOIN public.profiles p ON al.user_id = p.id
ORDER BY al.created_at DESC;

-- View para eventos de segurança não resolvidos
CREATE OR REPLACE VIEW public.unresolved_security_events AS
SELECT 
    se.id,
    se.created_at,
    se.event_type,
    se.severity,
    se.description,
    p.full_name as user_name,
    p.email as user_email,
    se.ip_address,
    se.metadata
FROM public.security_events se
LEFT JOIN public.profiles p ON se.user_id = p.id
WHERE se.resolved = FALSE
ORDER BY 
    CASE se.severity 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    se.created_at DESC;

-- 10. INSERIR DADOS DE EXEMPLO
-- ============================================================================

-- Inserir log de inicialização do sistema
SELECT public.create_audit_log(
    NULL,
    'system_initialization',
    'audit_system',
    'migration_20250908000005',
    NULL,
    '{"message": "Sistema de auditoria inicializado com sucesso"}'::jsonb
);

-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria de todas as operações do sistema';
COMMENT ON TABLE public.security_events IS 'Eventos de segurança e tentativas suspeitas';
COMMENT ON TABLE public.integrity_checks IS 'Verificações de integridade de dados';

COMMENT ON FUNCTION public.create_audit_log IS 'Função para criar logs de auditoria';
COMMENT ON FUNCTION public.create_security_event IS 'Função para registrar eventos de segurança';
COMMENT ON FUNCTION public.create_integrity_check IS 'Função para registrar verificações de integridade';

-- 12. VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar tabelas criadas
SELECT 
    'Tabelas de auditoria criadas:' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_logs', 'security_events', 'integrity_checks');

-- Verificar funções criadas
SELECT 
    'Funções de auditoria criadas:' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%audit%' OR routine_name LIKE '%security%' OR routine_name LIKE '%integrity%';

-- 13. MENSAGEM FINAL
-- ============================================================================

SELECT 
    '🎉 SISTEMA DE AUDITORIA CRIADO COM SUCESSO!' as resultado,
    '✅ Tabelas de auditoria criadas' as item_1,
    '✅ Políticas RLS configuradas' as item_2,
    '✅ Funções de auditoria implementadas' as item_3,
    '✅ Triggers automáticos configurados' as item_4,
    '✅ Views de relatório criadas' as item_5,
    '✅ Sistema de limpeza automática' as item_6,
    '🔒 Sistema de segurança aprimorado!' as proximo_passo;