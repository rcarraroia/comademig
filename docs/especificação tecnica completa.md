ESPECIFICAÇÃO TÉCNICA COMPLETA
REFATORAÇÃO PAINEL ADMINISTRATIVO COMADEMIG + CORREÇÃO DE BUGS CRÍTICOS
Versão: 1.0
Data: 06/10/2025
Projeto: COMADEMIG - Convenção de Ministros das Assembleias de Deus em Minas Gerais
Solicitante: Equipe de Arquitetura
Destinatário: Kiro (Assistente de Desenvolvimento)

📑 ÍNDICE

ANÁLISE DO ESTADO ATUAL
CORREÇÕES CRÍTICAS - FASE 0
REFATORAÇÃO DO PAINEL ADMINISTRATIVO
FUNCIONALIDADES CORE
DESIGN TÉCNICO
PLANO DE IMPLEMENTAÇÃO
ANEXOS E SCRIPTS


<a name="parte-1"></a>
PARTE 1: ANÁLISE DO ESTADO ATUAL
1.1. BUGS CRÍTICOS IDENTIFICADOS
BUG #1: Sistema Unificado de Cargos + Planos NÃO FUNCIONA
Localização: /src/pages/admin/MemberTypeManagement.tsx
Descrição do Problema:

Interface permite criar "Cargo + Plano" em operação única
Sistema salva o cargo mas NÃO vincula o plano
Relacionamento member_types ↔ subscription_plans quebrado
Formulário de registro não consegue buscar o plano associado

Comportamento Atual:
1. Admin cria: "Bispo + Plano Bispo R$ 10,00"
2. Sistema cria registro em member_types ✓
3. Sistema NÃO cria registro em subscription_plans ✗
4. Usuário tenta se filiar como "Bispo"
5. Formulário NÃO encontra plano associado ✗
6. Filiação fica bloqueada ✗
Comportamento Esperado:
1. Admin cria: "Bispo + Plano Mensal R$ 10,00"
2. Sistema cria registro em member_types ✓
3. Sistema cria registro em subscription_plans ✓
4. Sistema vincula via member_type_id ✓
5. Usuário escolhe "Bispo" no formulário
6. Sistema mostra: "Plano Mensal - R$ 10,00" ✓
7. Filiação prossegue normalmente ✓
Causa Raiz Identificada:

Hook useMemberTypes não existe ou está incompleto
Mutation para criar subscription_plan não está sendo chamada
Schema do banco pode estar incorreto (relacionamento 1:1 vs 1:N)


BUG #2: Impossível Criar Múltiplas Periodicidades para Mesmo Cargo
Descrição do Problema:

Sistema atual impede criar:

Bispo Mensal (R$ 10,00)
Bispo Semestral (R$ 55,00)
Bispo Anual (R$ 100,00)


Constraint ou validação bloqueia nomes duplicados

Comportamento Atual:
1. Admin cria: "Bispo + Plano Mensal R$ 10,00" ✓
2. Admin tenta criar: "Bispo + Plano Anual R$ 100,00" ✗
3. Sistema retorna erro: "Cargo já existe" ✗
Comportamento Esperado:
1. Admin cria cargo: "Bispo"
2. Admin adiciona planos ao cargo:
   - Plano Mensal: R$ 10,00/mês
   - Plano Semestral: R$ 55,00/6 meses
   - Plano Anual: R$ 100,00/ano
3. Usuário escolhe "Bispo" no formulário
4. Sistema mostra TODOS os planos disponíveis
5. Usuário seleciona periodicidade desejada
Solução Proposta:

Alterar schema: member_types (1:N) subscription_plans
Interface: criar cargo UMA vez, adicionar MÚLTIPLOS planos
Formulário de filiação: mostrar dropdown de periodicidades


BUG #3: Botões Editar/Deletar Não Funcionam
Localização: /src/pages/admin/MemberTypeManagement.tsx
Descrição do Problema:

Interface mostra botões de editar e deletar
Clique não executa nenhuma ação
Hooks de mutation inexistentes ou quebrados

Código Problemático Identificado:
typescript// Hooks inexistentes:
const toggleStatusMutation = useToggleMemberTypeStatus(); // ❌
const deleteMutation = useDeleteMemberType(); // ❌
Ações Necessárias:

Criar hooks: useToggleMemberTypeStatus, useDeleteMemberType
Implementar mutations com TanStack Query
Adicionar confirmação antes de deletar
Implementar soft delete (is_active = false)


BUG #4: Propriedade order_of_exhibition Não Existe
Localização: /src/pages/admin/MemberTypesManagement.tsx
Código Problemático:
typescript<Badge variant="outline">
  {memberType.order_of_exhibition || 0}  // ❌ Propriedade não existe
</Badge>
Correção:
typescript<Badge variant="outline">
  {memberType.sort_order || 0}  // ✓ Propriedade correta
</Badge>

1.2. ANÁLISE DO BANCO DE DADOS (Conforme Relatório)
Tabelas Existentes com Dados
member_types - 6 registros
sqlEstrutura:
- id: UUID (PK)
- name: TEXT
- description: TEXT
- is_active: BOOLEAN
- sort_order: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- created_by: UUID (FK, nullable)

Dados:
1. Administrador (sort_order: 3)
2. Pastor (sort_order: 1)
3. Diácono (sort_order: 2)
4. Membro (sort_order: 3)
5. Evangelista (sort_order: 4)
6. Bispo (sort_order: null)
user_subscriptions - 1 registro ÓRFÃO
sqlEstrutura:
- id: UUID (PK)
- user_id: UUID (FK -> profiles) ❌ ÓRFÃO
- subscription_plan_id: UUID (FK -> subscription_plans) ❌ ÓRFÃO
- member_type_id: UUID (FK -> member_types) ✓
- status: TEXT
- payment_reference: TEXT
- auto_renew: BOOLEAN
- started_at: TIMESTAMP
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Registro órfão:
- user_id: c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a (não existe em profiles)
- subscription_plan_id: fb2f3276-f351-4ab0-950c-e9d4156d0af4 (não existe em subscription_plans)
Tabelas Vazias (Críticas)

profiles - 0 registros (CRÍTICO)
subscription_plans - 0 registros (CRÍTICO - bloqueia filiações)
asaas_cobrancas - 0 registros
solicitacoes_certidoes - 0 registros
notifications - 0 registros
notification_templates - 0 registros
content_pages - 0 registros
affiliates - 0 registros
affiliate_commissions - 0 registros
certidoes - 0 registros

Tabelas Inexistentes (Alto Impacto)

support_tickets - Sistema de suporte não funciona
support_messages - Chat de tickets não existe
support_categories - Categorização não existe
financial_transactions - Histórico financeiro não existe
certificate_types - Templates de certidões não existe
regularization_requests - Sistema de regularização não implementado
user_activity_log - Auditoria não funciona
audit_log - Logs de sistema não existem


1.3. ANÁLISE DO MENU LATERAL (Conforme Relatórios)
Menu Atual: 18 itens
Seção de Usuário (9 itens):

Dashboard - /dashboard (MISTO)
Meu Perfil - /dashboard/perfil-completo
Identificação Eclesiástica - /dashboard/carteira-digital
Financeiro - /dashboard/financeiro (MISTO)
Certidões - /dashboard/certidoes (MISTO)
Regularização - /dashboard/regularizacao
Afiliados - /dashboard/afiliados
Notificações - /dashboard/notifications
Suporte - /dashboard/suporte

Seção Administrativa (8 itens):

Gerenciar Usuários - /dashboard/admin/usuarios
Gestão de Cargos e Planos - /dashboard/admin/member-management
Financeiro (Asaas) - /dashboard/admin/financeiro-asaas (NÃO IMPLEMENTADO)
Regularização - /dashboard/admin/regularizacao (DUPLICADO)
Notificações - /dashboard/admin/notifications (DUPLICADO)
Diagnóstico do Sistema - /dashboard/admin/diagnostics
Atendimento ao Membro - /dashboard/admin/suporte
Gerenciar Conteúdo - /dashboard/admin/content

Navegação (1 item):

Voltar ao Site - /

Problemas Identificados:

Funcionalidades Mistas (3):

Dashboard principal
Financeiro
Certidões


Duplicações (2):

Regularização (user + admin)
Notificações (user + admin)


Rota Não Implementada (1):

Financeiro Asaas (admin)



Score de Separação: 83.3% (bom, mas melhorável)

1.4. FUNCIONALIDADES EXISTENTES
Componentes Administrativos Funcionais:

AdminUsers.tsx - Gestão de usuários
ContentManagement.tsx - Gerenciamento de conteúdo
Editores de conteúdo (8 páginas)

Componentes de Usuário Funcionais:

MeusDados.tsx - Dados pessoais
CarteiraDigital.tsx - Carteira digital
Certidoes.tsx - Solicitação de certidões
Financeiro.tsx - Dashboard financeiro
Afiliados.tsx - Sistema de afiliados

Componentes Quebrados/Incompletos:

MemberTypeManagement.tsx - Bugs críticos
SystemDiagnostics.tsx - Serviço inexistente
NotificationManagement.tsx - Tabela inexistente


<a name="parte-2"></a>
PARTE 2: CORREÇÕES CRÍTICAS - FASE 0
2.1. CORREÇÃO DO SCHEMA DO BANCO DE DADOS
Problema Atual:
member_types (1) ──── (1) subscription_plans
Relacionamento 1:1 impede múltiplas periodicidades
Solução Proposta:
member_types (1) ──── (N) subscription_plans
Um cargo pode ter múltiplos planos (mensal, semestral, anual)
Script de Migração SQL:
sql-- =====================================================
-- MIGRAÇÃO 001: Correção Schema Cargos e Planos
-- Data: 06/10/2025
-- Descrição: Corrige relacionamento para permitir múltiplas periodicidades
-- =====================================================

-- PASSO 1: Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- PASSO 2: Adicionar coluna member_type_id se não existir
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS member_type_id UUID REFERENCES member_types(id) ON DELETE CASCADE;

-- PASSO 3: Adicionar coluna duration_months se não existir
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS duration_months INTEGER NOT NULL DEFAULT 1;

-- PASSO 4: Adicionar constraint para evitar duplicação de periodicidade
ALTER TABLE subscription_plans
ADD CONSTRAINT unique_member_type_duration 
UNIQUE (member_type_id, duration_months);

-- PASSO 5: Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_member_type_id 
ON subscription_plans(member_type_id);

-- PASSO 6: Adicionar campos necessários se não existirem
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- PASSO 7: Popular com planos padrão para cada cargo existente
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Mensal',
    CASE mt.name
        WHEN 'Bispo' THEN 10.00
        WHEN 'Pastor' THEN 15.00
        WHEN 'Diácono' THEN 8.00
        WHEN 'Membro' THEN 5.00
        WHEN 'Evangelista' THEN 12.00
        WHEN 'Administrador' THEN 0.00
        ELSE 10.00
    END,
    1, -- mensal
    true,
    1,
    '{"certidoes": 5, "suporte": "email"}'
FROM member_types mt
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 1
);

-- PASSO 8: Adicionar planos semestrais
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Semestral',
    CASE mt.name
        WHEN 'Bispo' THEN 55.00
        WHEN 'Pastor' THEN 85.00
        WHEN 'Diácono' THEN 45.00
        WHEN 'Membro' THEN 28.00
        WHEN 'Evangelista' THEN 68.00
        WHEN 'Administrador' THEN 0.00
        ELSE 55.00
    END,
    6, -- semestral
    true,
    2,
    '{"certidoes": "unlimited", "suporte": "priority", "desconto": "8%"}'
FROM member_types mt
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 6
);

-- PASSO 9: Adicionar planos anuais
INSERT INTO subscription_plans (
    member_type_id,
    name,
    price,
    duration_months,
    is_active,
    sort_order,
    features
)
SELECT 
    mt.id,
    mt.name || ' - Anual',
    CASE mt.name
        WHEN 'Bispo' THEN 100.00
        WHEN 'Pastor' THEN 150.00
        WHEN 'Diácono' THEN 80.00
        WHEN 'Membro' THEN 50.00
        WHEN 'Evangelista' THEN 120.00
        WHEN 'Administrador' THEN 0.00
        ELSE 100.00
    END,
    12, -- anual
    true,
    3,
    '{"certidoes": "unlimited", "suporte": "phone", "desconto": "17%"}'
FROM member_types mt
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans sp 
    WHERE sp.member_type_id = mt.id AND sp.duration_months = 12
);

-- PASSO 10: Corrigir registro órfão em user_subscriptions
UPDATE user_subscriptions
SET subscription_plan_id = (
    SELECT id FROM subscription_plans 
    WHERE member_type_id = user_subscriptions.member_type_id 
    AND duration_months = 1 
    LIMIT 1
)
WHERE subscription_plan_id = 'fb2f3276-f351-4ab0-950c-e9d4156d0af4';

-- PASSO 11: Verificar resultado
SELECT 
    mt.name as cargo,
    sp.name as plano,
    sp.price,
    sp.duration_months,
    sp.is_active
FROM member_types mt
LEFT JOIN subscription_plans sp ON mt.id = sp.member_type_id
ORDER BY mt.name, sp.duration_months;

-- PASSO 12: Criar função para auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASSO 13: Criar trigger para subscription_plans
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DA MIGRAÇÃO 001
-- =====================================================
Instruções de Execução Manual:

Acessar painel Supabase
Ir em SQL Editor
Copiar e colar script completo
Executar
Verificar resultado da query final
Confirmar que todos os cargos têm 3 planos (mensal, semestral, anual)


2.2. CRIAÇÃO DO USUÁRIO SUPER-ADMIN
sql-- =====================================================
-- MIGRAÇÃO 002: Criar Usuário Super-Admin
-- Data: 06/10/2025
-- =====================================================

-- PASSO 1: Criar perfil super-admin
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', -- ID do registro órfão
    'admin@comademig.org.br', -- SUBSTITUIR POR SEU EMAIL
    'Super Administrador', -- SUBSTITUIR POR SEU NOME
    'super_admin',
    true,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    is_active = true,
    updated_at = now();

-- PASSO 2: Verificar criação
SELECT * FROM profiles WHERE role = 'super_admin';

-- =====================================================
-- FIM DA MIGRAÇÃO 002
-- =====================================================

2.3. CRIAÇÃO DE TABELAS FALTANTES CRÍTICAS
Sistema de Suporte
sql-- =====================================================
-- MIGRAÇÃO 003: Sistema de Suporte
-- Data: 06/10/2025
-- =====================================================

-- PASSO 1: Criar tabela de categorias
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

-- PASSO 2: Criar tabela de tickets
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

-- PASSO 3: Criar tabela de mensagens
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

-- PASSO 4: Popular categorias padrão
INSERT INTO support_categories (name, description, icon, sort_order) VALUES
('Dúvidas sobre Filiação', 'Questões sobre processo de filiação', 'HelpCircle', 1),
('Problemas Financeiros', 'Pagamentos, boletos, cobranças', 'DollarSign', 2),
('Certidões', 'Solicitação e emissão de certidões', 'FileText', 3),
('Regularização', 'Processos de regularização de entidades', 'Building', 4),
('Técnico/Sistema', 'Problemas técnicos e bugs', 'AlertCircle', 5),
('Alteração Cadastral', 'Mudança de dados pessoais', 'User', 6),
('Outros', 'Outras questões', 'MessageSquare', 99)
ON CONFLICT (name) DO NOTHING;

-- PASSO 5: Criar índices
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);

-- PASSO 6: Criar triggers
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_categories_updated_at ON support_categories;
CREATE TRIGGER update_support_categories_updated_at
    BEFORE UPDATE ON support_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 7: Habilitar RLS
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- PASSO 8: Políticas RLS - Categorias (todos podem ver)
CREATE POLICY "Categorias são públicas" ON support_categories
    FOR SELECT USING (is_active = true);

-- PASSO 9: Políticas RLS - Tickets (usuários veem seus próprios)
CREATE POLICY "Usuários veem seus próprios tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus próprios tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins veem todos os tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- PASSO 10: Políticas RLS - Mensagens
CREATE POLICY "Usuários veem mensagens de seus tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários criam mensagens em seus tickets" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND support_tickets.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Admins veem todas as mensagens" ON support_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- PASSO 11: Verificar resultado
SELECT 
    'Categorias' as tabela,
    COUNT(*) as registros
FROM support_categories
UNION ALL
SELECT 'Tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'Mensagens', COUNT(*) FROM support_messages;

-- =====================================================
-- FIM DA MIGRAÇÃO 003
-- =====================================================

Sistema de Auditoria
sql-- =====================================================
-- MIGRAÇÃO 004: Sistema de Auditoria
-- Data: 06/10/2025
-- =====================================================

-- PASSO 1: Criar tabela de auditoria
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

-- PASSO 2: Criar índices
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_table_name ON user_activity_log(table_name);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);

-- PASSO 3: Criar função genérica de auditoria
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

-- PASSO 4: Aplicar auditoria em tabelas críticas
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_member_types
    AFTER INSERT OR UPDATE OR DELETE ON member_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_subscription_plans
    AFTER INSERT OR UPDATE OR DELETE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- PASSO 5: Habilitar RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Política RLS - Apenas admins podem ver logs
CREATE POLICY "Admins veem todos os logs" ON user_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- PASSO 7: Verificar
SELECT COUNT(*) FROM user_activity_log;

-- =====================================================
-- FIM DA MIGRAÇÃO 004
-- =====================================================

Histórico Financeiro
sql-- =====================================================
-- MIGRAÇÃO 005: Histórico Financeiro
-- Data: 06/10/2025
-- =====================================================

-- PASSO 1: Criar tabela de transações
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

-- PASSO 2: Criar índices
CREATE INDEX IF NOT EXISTS idx_financialTentar novamenteRMContinuarEditarsql_transactions_user_id ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_asaas_id ON financial_transactions(asaas_payment_id);

-- PASSO 3: Criar trigger
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PASSO 4: Habilitar RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Políticas RLS
CREATE POLICY "Usuários veem suas próprias transações" ON financial_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins veem todas as transações" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- PASSO 6: Criar função para sincronizar com Asaas
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

-- PASSO 7: Verificar
SELECT COUNT(*) FROM financial_transactions;

-- =====================================================
-- FIM DA MIGRAÇÃO 005
-- =====================================================

2.4. CORREÇÃO DE COMPONENTES QUEBRADOS
Arquivo: /src/hooks/useMemberTypes.ts (CRIAR NOVO)
typescriptimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface MemberType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SubscriptionPlan {
  id: string;
  member_type_id: string;
  name: string;
  price: number;
  duration_months: number;
  is_active: boolean;
  sort_order: number;
  features: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MemberTypeWithPlans extends MemberType {
  subscription_plans: SubscriptionPlan[];
}

interface UseMemberTypesOptions {
  includeInactive?: boolean;
  includePlans?: boolean;
}

export function useMemberTypes(options: UseMemberTypesOptions = {}) {
  const { includeInactive = false, includePlans = true } = options;

  return useQuery({
    queryKey: ['member-types', { includeInactive, includePlans }],
    queryFn: async () => {
      let query = supabase
        .from('member_types')
        .select(
          includePlans
            ? `
              *,
              subscription_plans (
                id,
                name,
                price,
                duration_months,
                is_active,
                sort_order,
                features
              )
            `
            : '*'
        )
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Ordenar planos por duration_months
      if (includePlans && data) {
        return data.map((mt: any) => ({
          ...mt,
          subscription_plans: mt.subscription_plans?.sort(
            (a: SubscriptionPlan, b: SubscriptionPlan) => 
              a.duration_months - b.duration_months
          ) || []
        })) as MemberTypeWithPlans[];
      }

      return data as MemberType[];
    },
  });
}

export function useCreateMemberTypeWithPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      memberType: Omit<MemberType, 'id' | 'created_at' | 'updated_at'>;
      plans: Array<{
        name: string;
        price: number;
        duration_months: number;
        features?: Record<string, any>;
        sort_order?: number;
      }>;
    }) => {
      // 1. Criar member_type
      const { data: memberType, error: mtError } = await supabase
        .from('member_types')
        .insert(data.memberType)
        .select()
        .single();

      if (mtError) throw mtError;

      // 2. Criar subscription_plans
      const plansToInsert = data.plans.map((plan, index) => ({
        member_type_id: memberType.id,
        name: plan.name,
        price: plan.price,
        duration_months: plan.duration_months,
        features: plan.features || {},
        sort_order: plan.sort_order ?? index + 1,
        is_active: true,
      }));

      const { error: plansError } = await supabase
        .from('subscription_plans')
        .insert(plansToInsert);

      if (plansError) throw plansError;

      return memberType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Cargo e planos criados com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar cargo e planos: ' + error.message);
    },
  });
}

export function useUpdateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<MemberType>;
    }) => {
      const { data: result, error } = await supabase
        .from('member_types')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar cargo: ' + error.message);
    },
  });
}

export function useToggleMemberTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar status atual
      const { data: current, error: fetchError } = await supabase
        .from('member_types')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Inverter status
      const { data, error } = await supabase
        .from('member_types')
        .update({ is_active: !current.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success(
        `Cargo ${data.is_active ? 'ativado' : 'desativado'} com sucesso!`
      );
    },
    onError: (error: any) => {
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}

export function useDeleteMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from('member_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Cargo removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover cargo: ' + error.message);
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<SubscriptionPlan>;
    }) => {
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Plano atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Plano removido com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover plano: ' + error.message);
    },
  });
}

Arquivo: /src/pages/admin/MemberTypeManagement.tsx (REFATORAR)
typescriptimport { useState } from 'react';
import { Plus, Edit, Trash2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useMemberTypes,
  useCreateMemberTypeWithPlans,
  useUpdateMemberType,
  useToggleMemberTypeStatus,
  useDeleteMemberType,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
} from '@/hooks/useMemberTypes';
import { formatCurrency } from '@/lib/utils';

interface PlanInput {
  name: string;
  price: string;
  duration_months: number;
  features: string;
}

export default function MemberTypeManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { data: memberTypes, isLoading } = useMemberTypes({
    includeInactive: showInactive,
    includePlans: true,
  });

  const createMutation = useCreateMemberTypeWithPlans();
  const updateMutation = useUpdateMemberType();
  const toggleMutation = useToggleMemberTypeStatus();
  const deleteMutation = useDeleteMemberType();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    plans: [
      { name: '', price: '', duration_months: 1, features: '{}' },
      { name: '', price: '', duration_months: 6, features: '{}' },
      { name: '', price: '', duration_months: 12, features: '{}' },
    ] as PlanInput[],
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const plans = formData.plans
      .filter((p) => p.name && p.price)
      .map((p, index) => ({
        name: p.name,
        price: parseFloat(p.price),
        duration_months: p.duration_months,
        features: p.features ? JSON.parse(p.features) : {},
        sort_order: index + 1,
      }));

    if (plans.length === 0) {
      alert('Adicione pelo menos um plano!');
      return;
    }

    await createMutation.mutateAsync({
      memberType: {
        name: formData.name,
        description: formData.description,
        is_active: true,
        sort_order: formData.sort_order,
      },
      plans,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      sort_order: 0,
      plans: [
        { name: '', price: '', duration_months: 1, features: '{}' },
        { name: '', price: '', duration_months: 6, features: '{}' },
        { name: '', price: '', duration_months: 12, features: '{}' },
      ],
    });
  };

  const handleToggleStatus = async (id: string) => {
    await toggleMutation.mutateAsync(id);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Cargos e Planos</h1>
          <p className="text-muted-foreground">
            Gerencie tipos de membro e seus planos de assinatura associados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Cargo + Planos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Tipo de Membro e Planos</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                {/* Dados do Cargo */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Dados do Cargo</h3>
                  <div>
                    <Label htmlFor="name">Nome do Cargo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Pastor, Diácono, Membro"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descreva as responsabilidades e características deste cargo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sort_order">Ordem de Exibição</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sort_order: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Planos */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Planos de Assinatura</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure até 3 periodicidades (mensal, semestral, anual). Deixe em branco os que não desejar criar.
                  </p>

                  {/* Plano Mensal */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Plano Mensal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Nome do Plano</Label>
                        <Input
                          value={formData.plans[0].name}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[0].name = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="Ex: Bispo Mensal"
                        />
                      </div>
                      <div>
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.plans[0].price}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[0].price = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="10.00"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plano Semestral */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Plano Semestral (6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Nome do Plano</Label>
                        <Input
                          value={formData.plans[1].name}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[1].name = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="Ex: Bispo Semestral"
                        />
                      </div>
                      <div>
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.plans[1].price}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[1].price = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="55.00"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Plano Anual */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Plano Anual (12 meses)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Nome do Plano</Label>
                        <Input
                          value={formData.plans[2].name}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[2].name = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="Ex: Bispo Anual"
                        />
                      </div>
                      <div>
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.plans[2].price}
                          onChange={(e) => {
                            const plans = [...formData.plans];
                            plans[2].price = e.target.value;
                            setFormData({ ...formData, plans });
                          }}
                          placeholder="100.00"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Criando...' : 'Criar Cargo + Planos'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Cargos */}
      <div className="space-y-4">
        {memberTypes?.map((memberType: any) => (
          <Card key={memberType.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>{memberType.name}</CardTitle>
                  <Badge variant={memberType.is_active ? 'default' : 'secondary'}>
                    {memberType.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">Ordem: {memberType.sort_order}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(memberType.id)}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(memberType.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {memberType.description && (
                <p className="text-sm text-muted-foreground">
                  {memberType.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-3">Planos Associados:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {memberType.subscription_plans?.map((plan: any) => (
                  <Card key={plan.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold">{plan.name}</h5>
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.duration_months === 1 && 'Mensal'}
                          {plan.duration_months === 6 && 'Semestral (6 meses)'}
                          {plan.duration_months === 12 && 'Anual (12 meses)'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memberType.subscription_plans?.length === 0 && (
                  <div className="col-span-3 text-center text-muted-foreground py-4">
                    Nenhum plano associado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Dialog para Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este cargo? Esta ação apenas desativará o
              cargo, mantendo o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

<a name="parte-3"></a>
PARTE 3: REFATORAÇÃO DO PAINEL ADMINISTRATIVO
3.1. NOVA ESTRUTURA DE MENU LATERAL
Arquivo: /src/components/dashboard/DashboardSidebar.tsx (REFATORAR)
typescriptimport { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  CreditCard, 
  FileText, 
  Bell, 
  HelpCircle,
  Users,
  Settings,
  DollarSign,
  Building,
  UserCheck,
  MessageSquare,
  Activity,
  BookOpen,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { profile, isAdmin, isSuperAdmin, signOut } = useAuth();

  // Menu de Usuário
  const userMenuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Início', icon: Home },
    { path: '/dashboard/perfil-completo', label: 'Meu Perfil', icon: User },
    { path: '/dashboard/carteira-digital', label: 'Carteira Digital', icon: CreditCard },
    { path: '/dashboard/minhas-certidoes', label: 'Minhas Certidões', icon: FileText },
    { path: '/dashboard/meus-pagamentos', label: 'Meus Pagamentos', icon: DollarSign },
    { path: '/dashboard/minhas-notificacoes', label: 'Notificações', icon: Bell },
    { path: '/dashboard/suporte', label: 'Suporte', icon: HelpCircle },
  ];

  // Menu Administrativo
  const adminMenuItems: MenuItem[] = [
    { path: '/dashboard/admin/dashboard', label: 'Dashboard Admin', icon: Activity },
    { path: '/dashboard/admin/usuarios', label: 'Gerenciar Usuários', icon: Users },
    { path: '/dashboard/admin/member-management', label: 'Cargos e Planos', icon: Settings },
    { path: '/dashboard/admin/certidoes', label: 'Gestão de Certidões', icon: FileText },
    { path: '/dashboard/admin/financeiro', label: 'Dashboard Financeiro', icon: DollarSign },
    { path: '/dashboard/admin/regularizacao', label: 'Regularizações', icon: Building },
    { path: '/dashboard/admin/afiliados', label: 'Sistema de Afiliados', icon: UserCheck },
    { path: '/dashboard/admin/notificacoes', label: 'Enviar Notificações', icon: Bell },
    { path: '/dashboard/admin/suporte', label: 'Atendimento', icon: MessageSquare },
    { path: '/dashboard/admin/content', label: 'Gerenciar Conteúdo', icon: BookOpen },
    { path: '/dashboard/admin/diagnostics', label: 'Diagnósticos', icon: Activity },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0',
          isOpen ?Tentar novamenteRMContinuarEditartypescript          'translate-x-0'
          : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="COMADEMIG" className="w-8 h-8" />
                <span className="font-bold text-lg">COMADEMIG</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-slate-800"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu de Usuário */}
            <nav className="flex-1 p-4 space-y-1">
              {userMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Menu Administrativo */}
              {(isAdmin() || isSuperAdmin()) && (
                <>
                  <Separator className="my-4 bg-slate-800" />
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Administração
                    </p>
                  </div>
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive(item.path)
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Voltar ao Site</span>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}

3.2. ATUALIZAÇÃO DE ROTAS
Arquivo: /src/App.tsx (ADICIONAR NOVAS ROTAS)
typescript// Importar novos componentes
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCertifications from '@/pages/admin/AdminCertifications';
import AdminFinanceiro from '@/pages/admin/AdminFinanceiro';
import AdminRegularizacao from '@/pages/admin/AdminRegularizacao';
import AdminAfiliados from '@/pages/admin/AdminAfiliados';
import AdminNotificacoes from '@/pages/admin/AdminNotificacoes';
import MinhasCertidoes from '@/pages/dashboard/MinhasCertidoes';
import MeusPagamentos from '@/pages/dashboard/MeusPagamentos';
import MinhasNotificacoes from '@/pages/dashboard/MinhasNotificacoes';

// Adicionar rotas no componente de rotas
<Route path="/dashboard/admin">
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="usuarios" element={<AdminUsers />} />
  <Route path="member-management" element={<MemberTypeManagement />} />
  <Route path="certidoes" element={<AdminCertifications />} />
  <Route path="financeiro" element={<AdminFinanceiro />} />
  <Route path="regularizacao" element={<AdminRegularizacao />} />
  <Route path="afiliados" element={<AdminAfiliados />} />
  <Route path="notificacoes" element={<AdminNotificacoes />} />
  <Route path="suporte" element={<AdminSupportPage />} />
  <Route path="content" element={<ContentManagement />} />
  <Route path="diagnostics" element={<SystemDiagnosticsPage />} />
</Route>

<Route path="/dashboard">
  <Route index element={<Dashboard />} />
  <Route path="perfil-completo" element={<PerfilCompleto />} />
  <Route path="carteira-digital" element={<CarteiraDigital />} />
  <Route path="minhas-certidoes" element={<MinhasCertidoes />} />
  <Route path="meus-pagamentos" element={<MeusPagamentos />} />
  <Route path="minhas-notificacoes" element={<MinhasNotificacoes />} />
  <Route path="suporte" element={<Suporte />} />
</Route>

3.3. COMPONENTES A CRIAR
Arquivo: /src/pages/admin/AdminDashboard.tsx (CRIAR NOVO)
typescriptimport { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingCertifications: number;
  openTickets: number;
  newMembersThisMonth: number;
  churnRate: number;
}

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-dashboard-metrics'],
    queryFn: async () => {
      // Total de membros
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Membros ativos
      const { count: activeMembers } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Receita mensal (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: revenueData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo.toISOString());

      const monthlyRevenue = revenueData?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      // Certidões pendentes
      const { count: pendingCertifications } = await supabase
        .from('solicitacoes_certidoes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Tickets abertos
      const { count: openTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        inactiveMembers: (totalMembers || 0) - (activeMembers || 0),
        monthlyRevenue,
        pendingCertifications: pendingCertifications || 0,
        openTickets: openTickets || 0,
      } as DashboardMetrics;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeMembers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certidões Pendentes</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingCertifications}</div>
            <p className="text-xs text-muted-foreground">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.openTickets}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Filiações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Gráfico será implementado com dados reais
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cargo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Gráfico será implementado com dados reais
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Lista de atividades será implementada
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

Arquivo: /src/pages/dashboard/MinhasCertidoes.tsx (CRIAR NOVO)
typescriptimport { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhasCertidoes() {
  const { user } = useAuth();

  const { data: certidoes, isLoading } = useQuery({
    queryKey: ['minhas-certidoes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certidoes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      approved: { variant: 'default', label: 'Aprovada' },
      rejected: { variant: 'destructive', label: 'Rejeitada' },
      issued: { variant: 'default', label: 'Emitida' },
    };
    return variants[status] || variants.pending;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minhas Certidões</h1>
          <p className="text-muted-foreground">
            Gerencie suas solicitações e certidões emitidas
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Certidão
        </Button>
      </div>

      {certidoes && certidoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma certidão encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não solicitou nenhuma certidão
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Primeira Certidão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certidoes?.map((certidao) => {
            const statusInfo = getStatusBadge(certidao.status);
            return (
              <Card key={certidao.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{certidao.tipo}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Solicitada em{' '}
                        {format(new Date(certidao.created_at), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {certidao.status === 'issued' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  )}
                  {certidao.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">
                      Sua solicitação está sendo analisada
                    </p>
                  )}
                  {certidao.status === 'rejected' && certidao.motivo_rejeicao && (
                    <div className="bg-destructive/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-destructive">
                        Motivo da rejeição:
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {certidao.motivo_rejeicao}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

3.4. FORMULÁRIO DE FILIAÇÃO CORRIGIDO
Arquivo: /src/components/filiacao/SelectMemberType.tsx (REFATORAR)
typescriptimport { useMemberTypes } from '@/hooks/useMemberTypes';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface SelectMemberTypeProps {
  onSelect: (memberTypeId: string, subscriptionPlanId: string) => void;
}

export default function SelectMemberType({ onSelect }: SelectMemberTypeProps) {
  const [selectedMemberType, setSelectedMemberType] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const { data: memberTypes, isLoading } = useMemberTypes({
    includeInactive: false,
    includePlans: true,
  });

  const handleMemberTypeChange = (value: string) => {
    setSelectedMemberType(value);
    setSelectedPlan(''); // Reset plan selection
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onSelect(selectedMemberType, planId);
  };

  const selectedType = memberTypes?.find((mt) => mt.id === selectedMemberType);

  if (isLoading) {
    return <div>Carregando tipos de membro...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Cargo */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Selecione seu Cargo Ministerial
        </label>
        <Select value={selectedMemberType} onValueChange={handleMemberTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha o tipo de membro" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Cargos Disponíveis</SelectLabel>
              {memberTypes?.map((memberType) => (
                <SelectItem key={memberType.id} value={memberType.id}>
                  {memberType.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {selectedType?.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedType.description}
          </p>
        )}
      </div>

      {/* Seleção de Plano */}
      {selectedType && selectedType.subscription_plans.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-3 block">
            Escolha a Periodicidade
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedType.subscription_plans.map((plan) => {
              const isSelected = plan.id === selectedPlan;
              const discount =
                plan.duration_months === 6
                  ? '8% de desconto'
                  : plan.duration_months === 12
                  ? '17% de desconto'
                  : null;

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 border-2 bg-blue-50'
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {plan.duration_months === 1 && 'Pagamento mensal'}
                            {plan.duration_months === 6 && 'Pagamento semestral'}
                            {plan.duration_months === 12 && 'Pagamento anual'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-3xl font-bold text-blue-600">
                          R$ {plan.price.toFixed(2)}
                        </div>
                        {plan.duration_months > 1 && (
                          <p className="text-xs text-muted-foreground">
                            R$ {(plan.price / plan.duration_months).toFixed(2)}/mês
                          </p>
                        )}
                      </div>

                      {discount && (
                        <Badge variant="secondary" className="w-full justify-center">
                          {discount}
                        </Badge>
                      )}

                      {plan.features && Object.keys(plan.features).length > 0 && (
                        <div className="text-xs space-y-1">
                          {Object.entries(plan.features).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-600" />
                              <span>
                                {key}: {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedType && selectedType.subscription_plans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum plano configurado para este cargo. Entre em contato com o
          administrador.
        </div>
      )}
    </div>
  );
}

<a name="parte-4"></a>
PARTE 4: FUNCIONALIDADES CORE
4.1. SISTEMA DE SUPORTE - COMPONENTES
Arquivo: /src/pages/admin/AdminSupportPage.tsx (REFATORAR)
typescriptimport { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Clock, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();

  // Buscar tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles(full_name, email),
          category:support_categories(name, icon)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Buscar mensagens do ticket selecionado
  const { data: messages } = useQuery({
    queryKey: ['support-messages', selectedTicket?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          user:profiles(full_name)
        `)
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedTicket,
  });

  // Enviar resposta
  const replyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        message: replyMessage,
        is_staff_reply: true,
      });

      if (error) throw error;

      // Atualizar status do ticket para "in_progress"
      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', selectedTicket.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      setReplyMessage('');
      toast.success('Resposta enviada com sucesso!');
    },
  });

  // Atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: newStatus,
          ...(newStatus === 'resolved' && { resolved_at: new Date().toISOString() }),
          ...(newStatus === 'closed' && { closed_at: new Date().toISOString() }),
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast.success('Status atualizado!');
    },
  });

  const getStatusBadge = (status: string) => {Tentar novamenteRMContinuarEditartypescriptconst variants: Record<string, any> = {
      open: { variant: 'secondary', label: 'Aberto', color: 'bg-yellow-500' },
      in_progress: { variant: 'default', label: 'Em Atendimento', color: 'bg-blue-500' },
      waiting_user: { variant: 'outline', label: 'Aguardando Usuário', color: 'bg-orange-500' },
      resolved: { variant: 'default', label: 'Resolvido', color: 'bg-green-500' },
      closed: { variant: 'secondary', label: 'Fechado', color: 'bg-gray-500' },
    };
    return variants[status] || variants.open;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { variant: 'secondary', label: 'Baixa' },
      medium: { variant: 'default', label: 'Média' },
      high: { variant: 'destructive', label: 'Alta' },
      urgent: { variant: 'destructive', label: 'Urgente' },
    };
    return variants[priority] || variants.medium;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atendimento ao Membro</h1>
          <p className="text-muted-foreground">Gerencie tickets de suporte</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="in_progress">Em Atendimento</SelectItem>
            <SelectItem value="waiting_user">Aguardando Usuário</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abertos</p>
                <p className="text-2xl font-bold">
                  {tickets?.filter((t) => t.status === 'open').length || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Atendimento</p>
                <p className="text-2xl font-bold">
                  {tickets?.filter((t) => t.status === 'in_progress').length || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold">
                  {tickets?.filter((t) => t.status === 'waiting_user').length || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolvidos Hoje</p>
                <p className="text-2xl font-bold">
                  {tickets?.filter(
                    (t) =>
                      t.status === 'resolved' &&
                      t.resolved_at &&
                      new Date(t.resolved_at).toDateString() === new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <div className="space-y-3">
        {tickets?.map((ticket) => {
          const statusInfo = getStatusBadge(ticket.status);
          const priorityInfo = getPriorityBadge(ticket.priority);

          return (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                      {ticket.category && (
                        <Badge variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {ticket.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {ticket.user?.full_name || 'Usuário'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tickets?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum ticket encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog do Ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações do Ticket */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {selectedTicket?.user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedTicket?.user?.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusBadge(selectedTicket?.status).variant}>
                  {getStatusBadge(selectedTicket?.status).label}
                </Badge>
                <Badge variant={getPriorityBadge(selectedTicket?.priority).variant}>
                  {getPriorityBadge(selectedTicket?.priority).label}
                </Badge>
              </div>
            </div>

            {/* Mensagens */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.is_staff_reply ? 'bg-blue-50 ml-8' : 'bg-slate-50 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {message.is_staff_reply ? 'Suporte' : message.user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd/MM HH:mm')}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            {/* Responder */}
            {selectedTicket?.status !== 'closed' && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <Select
                    value={selectedTicket?.status}
                    onValueChange={(value) => updateStatusMutation.mutate(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Atendimento</SelectItem>
                      <SelectItem value="waiting_user">Aguardando Usuário</SelectItem>
                      <SelectItem value="resolved">Resolver</SelectItem>
                      <SelectItem value="closed">Fechar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => replyMutation.mutate()}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                  >
                    Enviar Resposta
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

<a name="parte-5"></a>
PARTE 5: DESIGN TÉCNICO
5.1. INTERFACES TYPESCRIPT COMPLETAS
Arquivo: /src/types/index.ts (CRIAR/ATUALIZAR)
typescript// ==================== TYPES GLOBAIS ====================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  document_number?: string;
  address?: string;
  role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MemberType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  permissions?: Record<string, boolean>;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SubscriptionPlan {
  id: string;
  member_type_id: string;
  name: string;
  price: number;
  duration_months: number;
  is_active: boolean;
  sort_order: number;
  features: Record<string, any>;
  max_certidoes?: number;
  priority_support?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  payment_reference?: string;
  auto_renew: boolean;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: 'pix' | 'credit_card' | 'boleto' | 'debit_card';
  asaas_payment_id?: string;
  asaas_invoice_url?: string;
  asaas_transaction_receipt_url?: string;
  description?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  category_id?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_staff_reply: boolean;
  is_internal_note: boolean;
  attachments?: string[];
  created_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  type: 'ministerio' | 'vinculo' | 'atuacao' | 'historico' | 'ordenacao';
  status: 'pending' | 'approved' | 'rejected' | 'issued';
  pdf_url?: string;
  validation_code?: string;
  issued_by?: string;
  issued_at?: string;
  motivo_rejeicao?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'email' | 'push' | 'in_app';
  title: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  read_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  wallet_id_asaas: string;
  referral_code: string;
  status: 'active' | 'inactive' | 'suspended';
  total_conversions: number;
  total_earned: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  asaas_split_id?: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ==================== EXTENDED TYPES ====================

export interface MemberTypeWithPlans extends MemberType {
  subscription_plans: SubscriptionPlan[];
}

export interface SupportTicketWithRelations extends SupportTicket {
  user?: Profile;
  category?: {
    name: string;
    icon: string;
  };
  assigned_to_user?: Profile;
}

export interface FinancialTransactionWithRelations extends FinancialTransaction {
  user?: Profile;
  subscription?: UserSubscription;
}

// ==================== FORM TYPES ====================

export interface CreateMemberTypeForm {
  name: string;
  description: string;
  sort_order: number;
  plans: {
    name: string;
    price: number;
    duration_months: number;
    features?: Record<string, any>;
  }[];
}

export interface CreateCertificationRequest {
  type: Certification['type'];
  additional_info?: string;
  documents?: File[];
}

export interface SendNotificationForm {
  target: 'individual' | 'mass' | 'segmented';
  user_ids?: string[];
  filters?: {
    member_type_id?: string;
    subscription_status?: string;
    is_late_payment?: boolean;
  };
  channels: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
  title: string;
  message: string;
  scheduled_for?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ==================== DASHBOARD METRICS ====================

export interface AdminDashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingCertifications: number;
  openTickets: number;
  newMembersThisMonth: number;
  churnRate: number;
  topAffiliates: Array<{
    id: string;
    name: string;
    conversions: number;
    earned: number;
  }>;
}

5.2. UTILITÁRIOS E HELPERS
Arquivo: /src/lib/utils.ts (ATUALIZAR)
typescriptimport { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('pt-BR').format(d);
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d);
}

export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export function getDurationLabel(months: number): string {
  if (months === 1) return 'Mensal';
  if (months === 6) return 'Semestral';
  if (months === 12) return 'Anual';
  return `${months} meses`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-600 bg-green-50',
    inactive: 'text-gray-600 bg-gray-50',
    pending: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    paid: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    open: 'text-blue-600 bg-blue-50',
    resolved: 'text-green-600 bg-green-50',
    closed: 'text-gray-600 bg-gray-50',
  };
  return colors[status] || colors.pending;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateValidationCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`.toUpperCase();
}

export function maskDocument(document: string): string {
  if (document.length === 11) {
    // CPF: 123.456.789-10
    return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (document.length === 14) {
    // CNPJ: 12.345.678/0001-90
    return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return document;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

<a name="parte-6"></a>
PARTE 6: PLANO DE IMPLEMENTAÇÃO
FASE 0: CORREÇÕES CRÍTICAS (2-3 DIAS)
Objetivo: Resolver bugs bloqueadores e popular dados essenciais
Tarefa 0.1: Executar Migrações SQL

 Executar MIGRAÇÃO 001 (Correção schema cargos e planos)
 Executar MIGRAÇÃO 002 (Criar super-admin)
 Executar MIGRAÇÃO 003 (Sistema de suporte)
 Executar MIGRAÇÃO 004 (Sistema de auditoria)
 Executar MIGRAÇÃO 005 (Histórico financeiro)
 Verificar dados criados
 Testar relacionamentos

Tarefa 0.2: Criar Hook useMemberTypes

 Criar arquivo /src/hooks/useMemberTypes.ts
 Implementar useMemberTypes
 Implementar useCreateMemberTypeWithPlans
 Implementar useUpdateMemberType
 Implementar useToggleMemberTypeStatus
 Implementar useDeleteMemberType
 Implementar useUpdateSubscriptionPlan
 Implementar useDeleteSubscriptionPlan
 Testar hooks

Tarefa 0.3: Refatorar MemberTypeManagement

 Atualizar /src/pages/admin/MemberTypeManagement.tsx
 Implementar formulário de criação com múltiplos planos
 Implementar botões de ação funcionais
 Testar criação de cargo com planos
 Testar edição
 Testar exclusão (soft delete)

Tarefa 0.4: Corrigir Formulário de Filiação

 Atualizar /src/components/filiacao/SelectMemberType.tsx
 Implementar seleção de cargo
 Implementar seleção de periodicidade
 Testar fluxo completo
 Validar integração com Asaas

Critérios de Aceite:

✅ Cargos criados aparecem no formulário
✅ Planos múltiplos funcionam
✅ Botões editar/deletar funcionam
✅ Filiação prossegue normalmente


FASE 1: ESTRUTURA BASE DO PAINEL (1 SEMANA)
Tarefa 1.1: Refatorar Menu Lateral

 Atualizar /src/components/dashboard/DashboardSidebar.tsx
 Separar menu usuário vs admin
 Adicionar seção "Administração"
 Implementar badges de notificação
 Testar navegação

Tarefa 1.2: Atualizar Rotas

 Atualizar /src/App.tsx
 Adicionar rotas administrativas
 Adicionar rotas de usuário
 Implementar guards de permissão
 Testar redirecionamentos

Tarefa 1.3: Criar Componentes Base

 Criar /src/components/admin/StatCard.tsx
 Criar /src/components/admin/MetricChart.tsx
 Criar /src/components/admin/DataTable.tsx
 Criar /src/components/ui/Empty State.tsx
 Documentar componentes

Tarefa 1.4: Implementar Dashboard Admin

 Criar /src/pages/admin/AdminDashboard.tsx
 Implementar cards de métricas
 Implementar gráficos (placeholder)
 Implementar lista de atividades recentes
 Testar visualização

Critérios de Aceite:

✅ Menu organizado e funcional
✅ Rotas protegidas por role
✅ Dashboard mostra métricas reais
✅ Navegação intuitiva


FASE 2: FUNCIONALIDADES CORE (2 SEMANAS)
Tarefa 2.1: Sistema de Certidões Completo

 Criar /src/pages/admin/AdminCertifications.tsx
 Criar /src/pages/dashboard/MinhasCertidoes.tsx
 Implementar aprovação/rejeição
 Implementar geração de PDF
 Implementar validação de certidões
 Testar fluxo completo

Tarefa 2.2: Dashboard Financeiro

 Criar /src/pages/admin/AdminFinanceiro.tsx
 Criar /src/pages/dashboard/MeusPagamentos.tsx
 Implementar gráficos de receita
 Implementar lista de transações
 Implementar filtros avançados
 Integrar com Asaas
 Testar relatórios

Tarefa 2.3: Sistema de Notificações

 Criar /src/pages/admin/AdminNotificacoes.tsx
 Criar /src/pages/dashboard/MinhasNotificacoes.tsx
 Implementar templates
 Implementar envio em massa
 Implementar agendamento
 Implementar histórico
 Testar envios

Tarefa 2.4: Sistema de Afiliados

 Criar /src/pages/admin/AdminAfiliados.tsx
 Implementar dashboard de performance
 Implementar gestão de comissões
 Implementar relatórios
 Integrar split Asaas
 Testar pagamentos

Critérios de Aceite:

✅ Certidões aprovadas são emitidas
✅ Dashboard financeiro preciso
✅ Notificações enviadas e recebidas
✅ Comissões calculadas corretamente


FASE 3: FUNCIONALIDADES AVANÇADAS (2 SEMANAS)
Tarefa 3.1: Sistema de Regularização

 Criar /src/pages/admin/AdminRegularizacao.tsx
 Implementar fluxo de solicitação
 Implementar upload de documentos
 Implementar status workflow
 Implementar notificações automáticas
 Testar processo completo

Tarefa 3.2: Sistema de Suporte Completo

 Refatorar /src/pages/admin/AdminSupportPage.tsx
 Criar /src/pages/dashboard/Suporte.tsx
 Implementar chat em tempo real
 Implementar base de conhecimento
 Implementar FAQ
 Testar atendimento

Tarefa 3.3: Diagnósticos do Sistema

 Criar /src/services/diagnosticService.ts
 Implementar monitoramento
 Implementar logs estruturados
 Implementar alertas
 Criar dashboard de health
 Testar alertas

Tarefa 3.4: Auditoria e Relatórios

 Implementar visualização de auditoria
 Criar relatórios exportáveis
 Implementar filtros avançados
 Implementar busca
 Testar exportação

Critérios de Aceite:

✅ Regularização automatizada
✅ Suporte funcional
✅ Diagnósticos precisos
✅ Auditoria completa


<a name="parte-7"></a>
PARTE 7: ANEXOS E SCRIPTS
7.1. CHECKLIST DE VALIDAÇÃO
markdown## FASE 0 - CORREÇÕES CRÍTICAS

### Banco de Dados
- [ ] subscription_plans populado com dados
- [ ] profiles tem super-admin
- [ ] Relacionamento member_types ↔ subscription_plans funciona
- [ ] Tabelas de suTentar novamenteRMContinuarEditarmarkdownporte criadas
- [ ] Tabelas de auditoria criadas
- [ ] Tabelas financeiras criadas

### Código
- [ ] Hook useMemberTypes funciona
- [ ] MemberTypeManagement refatorado
- [ ] Formulário de filiação corrigido
- [ ] Bugs de botões resolvidos

### Testes
- [ ] Criar cargo com 3 planos (mensal, semestral, anual)
- [ ] Editar cargo existente
- [ ] Desativar cargo
- [ ] Selecionar cargo no formulário de filiação
- [ ] Ver planos disponíveis
- [ ] Completar filiação com pagamento

---

## FASE 1 - ESTRUTURA BASE

### Interface
- [ ] Menu lateral reorganizado
- [ ] Separação admin/user clara
- [ ] Rotas administrativas funcionam
- [ ] Dashboard admin mostra métricas

### Componentes
- [ ] StatCard reutilizável
- [ ] MetricChart implementado
- [ ] DataTable com filtros
- [ ] EmptyState padronizado

### Testes
- [ ] Navegar entre menus
- [ ] Verificar permissões
- [ ] Testar responsividade
- [ ] Validar métricas do dashboard

---

## FASE 2 - FUNCIONALIDADES CORE

### Certidões
- [ ] Solicitar certidão (usuário)
- [ ] Aprovar/rejeitar (admin)
- [ ] Gerar PDF automaticamente
- [ ] Validar código de certidão

### Financeiro
- [ ] Dashboard de receitas
- [ ] Lista de transações
- [ ] Filtros funcionando
- [ ] Integração Asaas OK

### Notificações
- [ ] Criar template
- [ ] Enviar individual
- [ ] Enviar em massa
- [ ] Agendar envio
- [ ] Verificar entrega

### Afiliados
- [ ] Visualizar conversões
- [ ] Calcular comissões
- [ ] Pagar via Asaas
- [ ] Relatórios de performance

---

## FASE 3 - FUNCIONALIDADES AVANÇADAS

### Regularização
- [ ] Solicitar serviço
- [ ] Upload de documentos
- [ ] Workflow de status
- [ ] Notificações automáticas

### Suporte
- [ ] Criar ticket
- [ ] Responder ticket
- [ ] Alterar status
- [ ] Fechar ticket
- [ ] Base de conhecimento

### Sistema
- [ ] Diagnósticos funcionam
- [ ] Logs estruturados
- [ ] Alertas configurados
- [ ] Auditoria visível

7.2. GUIA DE EXECUÇÃO MANUAL
markdown# GUIA DE EXECUÇÃO MANUAL - REFATORAÇÃO PAINEL ADMIN

## PASSO 1: BACKUP DO BANCO DE DADOS

**CRÍTICO:** Antes de executar qualquer script, faça backup completo.

1. Acessar Supabase Dashboard
2. Ir em "Database" → "Backups"
3. Clicar em "Create backup"
4. Aguardar conclusão
5. Verificar backup criado

---

## PASSO 2: EXECUTAR MIGRAÇÕES SQL

### Migração 001 - Correção Schema
1. Copiar script completo da MIGRAÇÃO 001
2. Acessar "SQL Editor" no Supabase
3. Colar o script
4. Clicar em "Run"
5. Verificar resultado da última query (deve mostrar todos os cargos com 3 planos cada)
6. Se houver erro, **NÃO PROSSEGUIR** e reportar

### Migração 002 - Super Admin
1. **IMPORTANTE:** Substituir email e nome no script
2. Copiar script da MIGRAÇÃO 002
3. Executar no SQL Editor
4. Verificar criação: `SELECT * FROM profiles WHERE role = 'super_admin';`
5. Deve retornar 1 registro

### Migrações 003, 004, 005
1. Executar na ordem
2. Verificar cada uma antes de prosseguir
3. Anotar erros se houver

---

## PASSO 3: IMPLEMENTAR CÓDIGO

### 3.1. Criar Hook useMemberTypes
1. Criar arquivo `/src/hooks/useMemberTypes.ts`
2. Copiar código fornecido
3. Salvar e testar imports

### 3.2. Refatorar MemberTypeManagement
1. Abrir `/src/pages/admin/MemberTypeManagement.tsx`
2. Fazer backup do arquivo atual
3. Substituir por novo código
4. Salvar

### 3.3. Atualizar Formulário de Filiação
1. Abrir `/src/components/filiacao/SelectMemberType.tsx`
2. Fazer backup
3. Substituir por novo código
4. Salvar

### 3.4. Atualizar Menu Lateral
1. Abrir `/src/components/dashboard/DashboardSidebar.tsx`
2. Fazer backup
3. Substituir por novo código
4. Salvar

---

## PASSO 4: TESTES

### Teste 1: Criar Cargo com Planos
1. Acessar painel admin
2. Ir em "Gestão de Cargos e Planos"
3. Clicar em "Criar Novo Cargo + Planos"
4. Preencher:
   - Nome: "Teste"
   - Plano Mensal: "Teste Mensal" - R$ 10,00
   - Plano Semestral: "Teste Semestral" - R$ 55,00
   - Plano Anual: "Teste Anual" - R$ 100,00
5. Criar
6. **Esperado:** Cargo criado com 3 planos visíveis

### Teste 2: Formulário de Filiação
1. Fazer logout
2. Ir para página de filiação
3. Selecionar cargo "Teste"
4. **Esperado:** Ver 3 opções de plano
5. Selecionar um plano
6. **Esperado:** Prosseguir para pagamento

### Teste 3: Menu Lateral
1. Fazer login como admin
2. Verificar seção "Administração"
3. Clicar em cada menu
4. **Esperado:** Rotas funcionando

---

## PASSO 5: ROLLBACK (SE NECESSÁRIO)

Se algo der errado:

1. **Código:**
   - Restaurar arquivos do backup
   - Reverter commits do git

2. **Banco de Dados:**
   - Acessar "Database" → "Backups"
   - Restaurar backup anterior
   - **ATENÇÃO:** Isso apagará dados criados após o backup

---

## SUPORTE

Em caso de dúvidas ou erros:
1. Anotar mensagem de erro completa
2. Anotar passo onde ocorreu
3. Fazer screenshot se possível
4. Reportar para análise

7.3. SCRIPTS DE VERIFICAÇÃO
sql-- =====================================================
-- SCRIPTS DE VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================

-- VERIFICAÇÃO 1: Estrutura de Tabelas
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'member_types',
    'subscription_plans',
    'support_tickets',
    'support_messages',
    'support_categories',
    'user_activity_log',
    'financial_transactions'
)
ORDER BY table_name;

-- VERIFICAÇÃO 2: Dados Populados
SELECT 
    'member_types' as tabela,
    COUNT(*) as registros
FROM member_types
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL
SELECT 'support_categories', COUNT(*) FROM support_categories
UNION ALL
SELECT 'profiles (admin)', COUNT(*) FROM profiles WHERE role IN ('super_admin', 'admin');

-- VERIFICAÇÃO 3: Relacionamentos
SELECT 
    mt.name as cargo,
    COUNT(sp.id) as quantidade_planos
FROM member_types mt
LEFT JOIN subscription_plans sp ON mt.id = sp.member_type_id
GROUP BY mt.id, mt.name
ORDER BY mt.name;

-- VERIFICAÇÃO 4: Índices Criados
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'subscription_plans',
    'support_tickets',
    'support_messages',
    'user_activity_log',
    'financial_transactions'
)
ORDER BY tablename, indexname;

-- VERIFICAÇÃO 5: Políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- VERIFICAÇÃO 6: Triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- VERIFICAÇÃO 7: Constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN (
    'subscription_plans',
    'support_tickets',
    'financial_transactions'
)
ORDER BY tc.table_name, tc.constraint_type;

-- =====================================================
-- FIM DOS SCRIPTS DE VERIFICAÇÃO
-- =====================================================

CONCLUSÃO DO DOCUMENTO
Este documento técnico completo fornece:

Análise detalhada do estado atual do sistema
Correções críticas com scripts SQL prontos para execução manual
Código completo de componentes e hooks
Estrutura reorganizada do painel administrativo
Plano de implementação incremental e testável
Guias de execução passo a passo

PRÓXIMOS PASSOS RECOMENDADOS:

Revisar este documento e validar se cobre todas as necessidades
Executar FASE 0 (Correções Críticas) primeiro
Testar extensivamente cada fase antes de prosseguir
Documentar problemas encontrados durante implementação
Ajustar cronograma conforme necessário

OBSERVAÇÕES IMPORTANTES:

Todos os scripts SQL devem ser executados manualmente no painel Supabase
Fazer backup antes de cada alteração no banco
Testar em ambiente de desenvolvimento antes de produção
Reportar qualquer erro imediatamente


Documento criado em: 06/10/2025
Versão: 1.0
Status: Pronto para implementação
Kiro, você pode iniciar a implementação seguindo este documento. Qualquer dúvida ou bloqueio, reporte imediatamente.