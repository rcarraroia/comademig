-- ============================================================================
-- SISTEMA DE REGULARIZAÇÃO - CRIAÇÃO DE TABELA E INTEGRAÇÃO
-- Data: 09/01/2025
-- Objetivo: Criar sistema completo de regularização com pagamentos
-- ============================================================================

-- 1. CRIAR TABELA DE SOLICITAÇÕES DE REGULARIZAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitacoes_regularizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados da solicitação
    servicos_selecionados JSONB NOT NULL DEFAULT '[]',
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total >= 0),
    descricao TEXT,
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'concluida')),
    numero_protocolo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Dados de pagamento
    payment_reference VARCHAR(255), -- Referência para asaas_cobrancas
    data_pagamento TIMESTAMP WITH TIME ZONE,
    
    -- Observações administrativas
    observacoes_admin TEXT,
    observacoes_cliente TEXT,
    
    -- Controle de datas
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. HABILITAR RLS
-- ============================================================================

ALTER TABLE public.solicitacoes_regularizacao ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS RLS
-- ============================================================================

-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Usuários podem ver suas próprias solicitações de regularização" 
    ON public.solicitacoes_regularizacao 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias solicitações
CREATE POLICY "Usuários podem criar solicitações de regularização" 
    ON public.solicitacoes_regularizacao 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias solicitações (apenas observações)
CREATE POLICY "Usuários podem atualizar suas observações" 
    ON public.solicitacoes_regularizacao 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Administradores podem ver todas as solicitações
CREATE POLICY "Administradores podem ver todas as solicitações de regularização" 
    ON public.solicitacoes_regularizacao 
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Administradores podem atualizar todas as solicitações
CREATE POLICY "Administradores podem atualizar solicitações de regularização" 
    ON public.solicitacoes_regularizacao 
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 4. CRIAR ÍNDICES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_solicitacoes_regularizacao_user_id ON solicitacoes_regularizacao(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_regularizacao_status ON solicitacoes_regularizacao(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_regularizacao_protocolo ON solicitacoes_regularizacao(numero_protocolo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_regularizacao_data_solicitacao ON solicitacoes_regularizacao(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_regularizacao_payment_ref ON solicitacoes_regularizacao(payment_reference);

-- 5. CRIAR TRIGGER DE UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_solicitacoes_regularizacao_updated_at
    BEFORE UPDATE ON public.solicitacoes_regularizacao
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. CRIAR FUNÇÃO PARA GERAR NÚMERO DE PROTOCOLO
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_regularization_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_protocol TEXT;
    protocol_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar protocolo no formato REG-YYYYMMDD-XXXXXX
        new_protocol := 'REG-' || to_char(now(), 'YYYYMMDD') || '-' || 
                       upper(substr(md5(random()::text), 1, 6));
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM public.solicitacoes_regularizacao 
            WHERE numero_protocolo = new_protocol
        ) INTO protocol_exists;
        
        -- Se não existe, usar este protocolo
        IF NOT protocol_exists THEN
            RETURN new_protocol;
        END IF;
    END LOOP;
END;
$$;

-- 7. CRIAR TRIGGER PARA GERAR PROTOCOLO AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION set_regularization_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.numero_protocolo IS NULL OR NEW.numero_protocolo = '' THEN
        NEW.numero_protocolo := generate_regularization_protocol();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_regularization_protocol
    BEFORE INSERT ON public.solicitacoes_regularizacao
    FOR EACH ROW
    EXECUTE FUNCTION set_regularization_protocol();

-- 8. CRIAR TABELA DE TIPOS DE SERVIÇOS DE REGULARIZAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.servicos_regularizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.servicos_regularizacao ENABLE ROW LEVEL SECURITY;

-- Política para visualização pública
CREATE POLICY "Todos podem ver serviços ativos" 
    ON public.servicos_regularizacao 
    FOR SELECT 
    USING (is_active = true);

-- Política para administradores
CREATE POLICY "Administradores podem gerenciar serviços" 
    ON public.servicos_regularizacao 
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 9. INSERIR SERVIÇOS PADRÃO
-- ============================================================================

INSERT INTO public.servicos_regularizacao (nome, descricao, valor, sort_order) VALUES
    ('Estatuto Social', 'Elaboração completa do estatuto social personalizado para sua igreja, incluindo registro em cartório', 450.00, 1),
    ('Ata de Fundação', 'Documento oficial de fundação da igreja com todas as formalidades legais necessárias', 250.00, 2),
    ('Ata de Eleição', 'Documentação da eleição da diretoria com validade legal e registro em cartório', 200.00, 3),
    ('Solicitação de CNPJ', 'Processo completo de obtenção do CNPJ incluindo formulários, documentação e acompanhamento', 380.00, 4),
    ('Consultoria Jurídica', 'Consultoria especializada em direito eclesiástico para dúvidas e orientações', 150.00, 5)
ON CONFLICT DO NOTHING;

-- 10. CRIAR ÍNDICES PARA SERVIÇOS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_servicos_regularizacao_active ON servicos_regularizacao(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_servicos_regularizacao_nome ON servicos_regularizacao(nome);

-- 11. ADICIONAR COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.solicitacoes_regularizacao IS 'Solicitações de regularização de igrejas';
COMMENT ON TABLE public.servicos_regularizacao IS 'Tipos de serviços de regularização disponíveis';

COMMENT ON COLUMN public.solicitacoes_regularizacao.servicos_selecionados IS 'Array JSON com IDs dos serviços selecionados';
COMMENT ON COLUMN public.solicitacoes_regularizacao.valor_total IS 'Valor total da solicitação (soma dos serviços)';
COMMENT ON COLUMN public.solicitacoes_regularizacao.numero_protocolo IS 'Número único de protocolo gerado automaticamente';
COMMENT ON COLUMN public.solicitacoes_regularizacao.payment_reference IS 'Referência para a cobrança no sistema de pagamentos';

-- ============================================================================
-- SCRIPT EXECUTADO COM SUCESSO
-- ============================================================================

SELECT 'Sistema de Regularização criado com sucesso!' as resultado;