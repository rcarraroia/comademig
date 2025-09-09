-- ============================================================================
-- SISTEMA DE PAGAMENTOS PARA CERTIDÕES
-- Data: 09/01/2025
-- Objetivo: Implementar valores e integração de pagamentos para certidões
-- ============================================================================

-- 1. CRIAR TABELA DE TIPOS DE CERTIDÕES COM VALORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tipos_certidoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    prazo_dias INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_certidoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver tipos de certidões ativas" 
    ON public.tipos_certidoes 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Administradores podem gerenciar tipos de certidões" 
    ON public.tipos_certidoes 
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 2. INSERIR TIPOS DE CERTIDÕES PADRÃO
-- ============================================================================

INSERT INTO public.tipos_certidoes (codigo, nome, descricao, valor, prazo_dias, sort_order) VALUES
    ('ministerio', 'Certidão de Ministério', 'Documento que comprova seu ministério na COMADEMIG', 45.00, 3, 1),
    ('vinculo', 'Certidão de Vínculo', 'Certifica seu vínculo com uma igreja local', 35.00, 3, 2),
    ('atuacao', 'Certidão de Atuação', 'Comprova sua atuação ministerial em campo específico', 40.00, 5, 3),
    ('historico', 'Histórico Ministerial', 'Histórico completo de sua trajetória ministerial', 55.00, 7, 4),
    ('ordenacao', 'Certidão de Ordenação', 'Certifica sua ordenação ministerial', 50.00, 5, 5)
ON CONFLICT (codigo) DO NOTHING;

-- 3. ATUALIZAR TABELA DE SOLICITAÇÕES DE CERTIDÕES
-- ============================================================================

-- Adicionar colunas necessárias se não existirem
DO $$
BEGIN
    -- Adicionar valor da certidão
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'solicitacoes_certidoes' 
        AND column_name = 'valor'
    ) THEN
        ALTER TABLE public.solicitacoes_certidoes 
        ADD COLUMN valor DECIMAL(10,2);
    END IF;
    
    -- Adicionar referência de pagamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'solicitacoes_certidoes' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE public.solicitacoes_certidoes 
        ADD COLUMN payment_reference VARCHAR(255);
    END IF;
    
    -- Adicionar data de pagamento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'solicitacoes_certidoes' 
        AND column_name = 'data_pagamento'
    ) THEN
        ALTER TABLE public.solicitacoes_certidoes 
        ADD COLUMN data_pagamento TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 4. CRIAR FUNÇÃO PARA CALCULAR VALOR DA CERTIDÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_certification_value(tipo_certidao_param TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    valor_certidao DECIMAL(10,2);
BEGIN
    -- Buscar valor do tipo de certidão
    SELECT valor INTO valor_certidao
    FROM public.tipos_certidoes
    WHERE codigo = tipo_certidao_param AND is_active = true;
    
    -- Se não encontrar, retornar valor padrão
    IF valor_certidao IS NULL THEN
        valor_certidao := 45.00; -- Valor padrão
    END IF;
    
    RETURN valor_certidao;
END;
$$;

-- 5. CRIAR TRIGGER PARA CALCULAR VALOR AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION set_certification_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calcular valor baseado no tipo de certidão
    IF NEW.valor IS NULL THEN
        NEW.valor := calculate_certification_value(NEW.tipo_certidao);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_set_certification_value ON public.solicitacoes_certidoes;

-- Criar novo trigger
CREATE TRIGGER trigger_set_certification_value
    BEFORE INSERT ON public.solicitacoes_certidoes
    FOR EACH ROW
    EXECUTE FUNCTION set_certification_value();

-- 6. ATUALIZAR STATUS PARA INCLUIR PAGAMENTO
-- ============================================================================

-- Atualizar constraint de status para incluir 'aguardando_pagamento'
ALTER TABLE public.solicitacoes_certidoes 
DROP CONSTRAINT IF EXISTS solicitacoes_certidoes_status_check;

ALTER TABLE public.solicitacoes_certidoes 
ADD CONSTRAINT solicitacoes_certidoes_status_check 
CHECK (status IN ('pendente', 'aguardando_pagamento', 'pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue'));

-- 7. CRIAR ÍNDICES ADICIONAIS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tipos_certidoes_codigo ON tipos_certidoes(codigo);
CREATE INDEX IF NOT EXISTS idx_tipos_certidoes_active ON tipos_certidoes(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_certidoes_valor ON solicitacoes_certidoes(valor);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_certidoes_payment_ref ON solicitacoes_certidoes(payment_reference);

-- 8. CRIAR FUNÇÃO PARA PROCESSAR PAGAMENTO DE CERTIDÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION process_certification_payment(
    solicitacao_id_param UUID,
    payment_reference_param VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    solicitacao_exists BOOLEAN;
BEGIN
    -- Verificar se a solicitação existe
    SELECT EXISTS(
        SELECT 1 FROM public.solicitacoes_certidoes 
        WHERE id = solicitacao_id_param
    ) INTO solicitacao_exists;
    
    IF NOT solicitacao_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar solicitação com dados do pagamento
    UPDATE public.solicitacoes_certidoes 
    SET 
        status = 'pago',
        payment_reference = payment_reference_param,
        data_pagamento = now(),
        updated_at = now()
    WHERE id = solicitacao_id_param;
    
    RETURN TRUE;
END;
$$;

-- 9. CRIAR VIEW PARA RELATÓRIOS DE CERTIDÕES
-- ============================================================================

CREATE OR REPLACE VIEW public.view_certidoes_relatorio AS
SELECT 
    sc.id,
    sc.numero_protocolo,
    sc.tipo_certidao,
    tc.nome as tipo_nome,
    tc.valor as valor_tabela,
    sc.valor as valor_cobrado,
    sc.status,
    sc.data_solicitacao,
    sc.data_pagamento,
    sc.data_aprovacao,
    sc.data_entrega,
    p.nome_completo as solicitante_nome,
    p.cpf as solicitante_cpf,
    CASE 
        WHEN sc.data_pagamento IS NOT NULL THEN 'Pago'
        WHEN sc.status = 'aguardando_pagamento' THEN 'Aguardando Pagamento'
        ELSE 'Não Pago'
    END as status_pagamento
FROM public.solicitacoes_certidoes sc
LEFT JOIN public.tipos_certidoes tc ON tc.codigo = sc.tipo_certidao
LEFT JOIN public.profiles p ON p.id = sc.user_id;

-- 10. ADICIONAR COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.tipos_certidoes IS 'Tipos de certidões disponíveis com valores';
COMMENT ON COLUMN public.solicitacoes_certidoes.valor IS 'Valor cobrado pela certidão';
COMMENT ON COLUMN public.solicitacoes_certidoes.payment_reference IS 'Referência do pagamento no sistema';
COMMENT ON COLUMN public.solicitacoes_certidoes.data_pagamento IS 'Data de confirmação do pagamento';

COMMENT ON FUNCTION calculate_certification_value(TEXT) IS 'Calcula o valor de uma certidão baseado no tipo';
COMMENT ON FUNCTION process_certification_payment(UUID, VARCHAR) IS 'Processa confirmação de pagamento de certidão';

COMMENT ON VIEW public.view_certidoes_relatorio IS 'View para relatórios de certidões com dados de pagamento';

-- ============================================================================
-- SCRIPT EXECUTADO COM SUCESSO
-- ============================================================================

SELECT 'Sistema de Pagamentos para Certidões implementado com sucesso!' as resultado;