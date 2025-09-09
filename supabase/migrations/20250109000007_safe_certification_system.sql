-- ============================================================================
-- CRIAÇÃO SEGURA DO SISTEMA DE CERTIDÕES
-- Data: 09/01/2025
-- Objetivo: Criar sistema de certidões de forma segura, verificando existência
-- ============================================================================

-- 1. REMOVER APENAS O QUE EXISTE
-- ============================================================================

-- Remover políticas apenas se existirem
DO $$
BEGIN
    -- Verificar e remover políticas de tipos_certidoes se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tipos_certidoes' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Todos podem ver tipos de certidões ativas" ON public.tipos_certidoes;
        DROP POLICY IF EXISTS "Admins podem gerenciar tipos de certidões" ON public.tipos_certidoes;
        DROP TABLE IF EXISTS public.tipos_certidoes CASCADE;
    END IF;
    
    -- Verificar e remover políticas de valores_certidoes se a tabela existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'valores_certidoes' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Todos podem ver valores de certidões" ON public.valores_certidoes;
        DROP POLICY IF EXISTS "Admins podem gerenciar valores de certidões" ON public.valores_certidoes;
        DROP TABLE IF EXISTS public.valores_certidoes CASCADE;
    END IF;
END $$;

-- Remover triggers e funções se existirem
DROP TRIGGER IF EXISTS trigger_set_certification_value ON public.solicitacoes_certidoes;
DROP FUNCTION IF EXISTS public.calculate_certification_value(TEXT);
DROP FUNCTION IF EXISTS public.set_certification_value();
DROP FUNCTION IF EXISTS public.process_certification_payment(UUID, VARCHAR);
DROP VIEW IF EXISTS public.view_certidoes_relatorio;

-- 2. CRIAR TABELA DE VALORES DE CERTIDÕES
-- ============================================================================

CREATE TABLE public.valores_certidoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    descricao TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.valores_certidoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver valores de certidões ativas" ON public.valores_certidoes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar valores de certidões" ON public.valores_certidoes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 3. INSERIR VALORES PADRÃO
-- ============================================================================

INSERT INTO public.valores_certidoes (tipo, nome, valor, descricao) VALUES
    ('ministerio', 'Certidão de Ministério', 45.00, 'Documento que comprova ministério na COMADEMIG'),
    ('vinculo', 'Certidão de Vínculo', 35.00, 'Certifica vínculo com igreja local'),
    ('atuacao', 'Certidão de Atuação', 40.00, 'Comprova atuação ministerial em campo específico'),
    ('historico', 'Histórico Ministerial', 55.00, 'Histórico completo da trajetória ministerial'),
    ('ordenacao', 'Certidão de Ordenação', 50.00, 'Certifica ordenação ministerial');

-- 4. ADICIONAR COLUNAS EM SOLICITACOES_CERTIDOES SE NÃO EXISTIREM
-- ============================================================================

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

-- 5. CRIAR FUNÇÃO PARA CALCULAR VALOR DA CERTIDÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_certification_value(tipo_certidao_param TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    valor_certidao DECIMAL(10,2);
BEGIN
    -- Buscar valor na tabela
    SELECT valor INTO valor_certidao
    FROM public.valores_certidoes 
    WHERE tipo = tipo_certidao_param AND is_active = true;
    
    -- Se não encontrar, usar valor padrão
    IF valor_certidao IS NULL THEN
        valor_certidao := 45.00; -- Valor padrão
    END IF;
    
    RETURN valor_certidao;
END;
$$;

-- 6. CRIAR FUNÇÃO TRIGGER PARA DEFINIR VALOR AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_certification_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Definir valor baseado no tipo se não foi fornecido
    IF NEW.valor IS NULL THEN
        NEW.valor := public.calculate_certification_value(NEW.tipo_certidao);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger
CREATE TRIGGER trigger_set_certification_value
    BEFORE INSERT ON public.solicitacoes_certidoes
    FOR EACH ROW
    EXECUTE FUNCTION set_certification_value();

-- 7. ATUALIZAR CONSTRAINT DE STATUS
-- ============================================================================

-- Remover constraint existente se houver
ALTER TABLE public.solicitacoes_certidoes 
DROP CONSTRAINT IF EXISTS solicitacoes_certidoes_status_check;

-- Adicionar nova constraint incluindo 'pago'
ALTER TABLE public.solicitacoes_certidoes 
ADD CONSTRAINT solicitacoes_certidoes_status_check 
CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'entregue', 'pago'));

-- 8. CRIAR FUNÇÃO PARA PROCESSAR PAGAMENTO DE CERTIDÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_certification_payment(
    solicitacao_id_param UUID,
    payment_reference_param VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_valores_certidoes_tipo ON public.valores_certidoes(tipo);
CREATE INDEX IF NOT EXISTS idx_valores_certidoes_active ON public.valores_certidoes(is_active);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_certidoes_payment_ref ON public.solicitacoes_certidoes(payment_reference);

-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.valores_certidoes IS 'Tabela de valores das certidões por tipo';
COMMENT ON FUNCTION public.calculate_certification_value IS 'Calcula valor da certidão baseado no tipo';
COMMENT ON FUNCTION public.set_certification_value IS 'Trigger para definir valor automaticamente';
COMMENT ON FUNCTION public.process_certification_payment IS 'Processa pagamento de certidão';

-- ============================================================================
-- SCRIPT SEGURO DE CERTIDÕES CONCLUÍDO
-- ============================================================================

SELECT 'Sistema de Certidões criado com segurança!' as resultado,
       (SELECT COUNT(*) FROM public.valores_certidoes) as tipos_certidao_criados;