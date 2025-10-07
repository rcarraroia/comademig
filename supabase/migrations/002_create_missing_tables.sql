-- =====================================================
-- MIGRAÇÃO 002: Criar Tabelas Faltantes do Sistema
-- Data: 06/10/2025
-- Descrição: Cria tabelas para suporte, auditoria e financeiro
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- =====================================================

-- PASSO 1: Criar tabela de categorias de suporte
CREATE TABLE IF NOT EXISTS support_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- PASSO 2: Criar tabela de tickets de suporte
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES support_categories(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- PASSO 3: Criar tabela de mensagens de suporte
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    is_internal_note BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT now()
);

-- PASSO 4: Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- PASSO 5: Criar tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'boleto', 'debit_card')),
    asaas_payment_id TEXT,
    asaas_invoice_url TEXT,
    asaas_transaction_receipt_url TEXT,
    description TEXT,
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- PASSO 6: Popular categorias padrão de suporte
INSERT INTO support_categories (name, description, icon, sort_order) VALUES
('Dúvidas sobre Filiação', 'Questões sobre processo de filiação', 'HelpCircle', 1),
('Problemas Financeiros', 'Pagamentos, boletos, cobranças', 'DollarSign', 2),
('Certidões', 'Solicitação e emissão de certidões', 'FileText', 3),
('Regularização', 'Processos de regularização de entidades', 'Building', 4),
('Técnico/Sistema', 'Problemas técnicos e bugs', 'AlertCircle', 5),
('Alteração Cadastral', 'Mudança de dados pessoais', 'User', 6),
('Outros', 'Outras questões', 'MessageSquare', 99)
ON CONFLICT (name) DO NOTHING;

-- PASSO 7: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id ON support_tickets(category_id);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_table_name ON user_activity_log(table_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_asaas_id ON financial_transactions(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_subscription_id ON financial_transactions(subscription_id);

-- PASSO 8: Criar função para auto-update updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASSO 9: Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_support_categories_updated_at ON support_categories;
CREATE TRIGGER update_support_categories_updated_at
    BEFORE UPDATE ON support_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 10: Habilitar RLS em todas as tabelas
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- PASSO 11: Políticas RLS - Categorias de suporte (públicas)
DROP POLICY IF EXISTS "Categorias são públicas" ON support_categories;
CREATE POLICY "Categorias são públicas" ON support_categories
    FOR SELECT USING (is_active = true);

-- PASSO 12: Políticas RLS - Tickets de suporte
DROP POLICY IF EXISTS "Usuários veem seus próprios tickets" ON support_tickets;
CREATE POLICY "Usuários veem seus próprios tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários criam seus próprios tickets" ON support_tickets;
CREATE POLICY "Usuários criam seus próprios tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins veem todos os tickets" ON support_tickets;
CREATE POLICY "Admins veem todos os tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

-- PASSO 13: Políticas RLS - Mensagens de suporte
DROP POLICY IF EXISTS "Usuários veem mensagens de seus tickets" ON support_messages;
CREATE POLICY "Usuários veem mensagens de seus tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários criam mensagens em seus tickets" ON support_messages;
CREATE POLICY "Usuários criam mensagens em seus tickets" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins veem todas as mensagens" ON support_messages;
CREATE POLICY "Admins veem todas as mensagens" ON support_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

-- PASSO 14: Políticas RLS - Logs de auditoria (apenas admins)
DROP POLICY IF EXISTS "Admins veem todos os logs" ON user_activity_log;
CREATE POLICY "Admins veem todos os logs" ON user_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

-- PASSO 15: Políticas RLS - Transações financeiras
DROP POLICY IF EXISTS "Usuários veem suas próprias transações" ON financial_transactions;
CREATE POLICY "Usuários veem suas próprias transações" ON financial_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins veem todas as transações" ON financial_transactions;
CREATE POLICY "Admins veem todas as transações" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.cargo = 'Administrador' OR profiles.tipo_membro = 'Administrador')
        )
    );

-- PASSO 16: Criar função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_activity_log (
            user_id,
            action,
            table_name,
            record_id,
            new_values
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO user_activity_log (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_activity_log (
            user_id,
            action,
            table_name,
            record_id,
            old_values
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 17: Aplicar auditoria em tabelas críticas
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_member_types ON member_types;
CREATE TRIGGER audit_member_types
    AFTER INSERT OR UPDATE OR DELETE ON member_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_subscription_plans ON subscription_plans;
CREATE TRIGGER audit_subscription_plans
    AFTER INSERT OR UPDATE OR DELETE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- PASSO 18: Criar função para criar transação financeira
CREATE OR REPLACE FUNCTION create_transaction_from_subscription(
    p_user_id UUID,
    p_subscription_id UUID,
    p_amount DECIMAL(10,2),
    p_due_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO financial_transactions (
        user_id,
        subscription_id,
        amount,
        status,
        description,
        due_date
    ) VALUES (
        p_user_id,
        p_subscription_id,
        p_amount,
        'pending',
        'Mensalidade de filiação',
        p_due_date
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 19: Verificar resultado final
SELECT 
    'support_categories' as tabela,
    COUNT(*) as registros
FROM support_categories
UNION ALL
SELECT 'support_tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'support_messages', COUNT(*) FROM support_messages
UNION ALL
SELECT 'user_activity_log', COUNT(*) FROM user_activity_log
UNION ALL
SELECT 'financial_transactions', COUNT(*) FROM financial_transactions;

-- PASSO 20: Verificar categorias de suporte criadas
SELECT 
    name,
    description,
    sort_order,
    is_active
FROM support_categories
ORDER BY sort_order;

-- =====================================================
-- FIM DA MIGRAÇÃO 002
-- =====================================================