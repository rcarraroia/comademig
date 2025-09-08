-- ============================================================================
-- LIMPEZA E CORREÇÃO DO SISTEMA DE CERTIDÕES
-- Data: 09/01/2025
-- Objetivo: Limpar conflitos e recriar sistema de certidões corretamente
-- ============================================================================

-- 1. REMOVER POLÍTICAS E OBJETOS CONFLITANTES
-- ============================================================================

-- Remover políticas que podem estar causando conflito
DROP POLICY IF EXISTS "Todos podem ver tipos de certidões ativas" ON public.tipos_certidoes;
DROP POLICY IF EXISTS "Admins podem gerenciar tipos de certidões" ON public.tipos_certidoes;
DROP POLICY IF EXISTS "Todos podem ver valores de certidões" ON public.valores_certidoes;
DROP POLICY IF EXISTS "Admins podem gerenciar valores de certidões" ON public.valores_certidoes;

-- Remover triggers que podem estar causando conflito
DROP TRIGGER IF EXISTS trigger_set_certification_value ON public.solicitacoes_certidoes;

-- Remover funções que podem estar causando conflito
DROP FUNCTION IF EXISTS public.calculate_certification_value(TEXT);
DROP FUNCTION IF EXISTS public.set_certification_value();
DROP FUNCTION IF EXISTS public.process_certification_payment(UUID, VARCHAR);

-- Remover views que podem estar causando conflito
DROP VIEW IF EXISTS public.view_certidoes_relatorio;

-- Remover tabelas se existirem (para recriar limpo)
DROP TABLE IF EXISTS public.tipos_certidoes CASCADE;
DROP TABLE IF EXISTS public.valores_certidoes CASCADE;

-- 2. CRIAR TABELA DE VALORES DE CERTIDÕES (SIMPLIFICADA)
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
    ('ordenacao', 'Certidão de Ordenação', 50.00, 'Certifica ordenação ministerial')
ON CONFLICT (tipo) DO UPDATE SET
    nome = EXCLUDED.nome,
    valor = EXCLUDED.valor,
    descricao = EXCLUDED.descricao,
    updated_at = now();

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

-- 7. CRIAR FUNÇÃO PARA PROCESSAR PAGAMENTO DE CERTIDÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_certification_payment(
    solicitacao_id_param UUID,
    payment_reference_param VARCHAR(255)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
        RAISE EXCEPTION 'Solicitação não encontrada';
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

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_valores_certidoes_tipo ON public.valores_certidoes(tipo);
CREATE INDEX IF NOT EXISTS idx_valores_certidoes_active ON public.valores_certidoes(is_active);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_certidoes_payment_ref ON public.solicitacoes_certidoes(payment_reference);

-- 9. ATUALIZAR CONSTRAINT DE STATUS PARA INCLUIR 'PAGO'
-- ============================================================================

-- Remover constraint existente se houver
ALTER TABLE public.solicitacoes_certidoes 
DROP CONSTRAINT IF EXISTS solicitacoes_certidoes_status_check;

-- Adicionar nova constraint
ALTER TABLE public.solicitacoes_certidoes 
ADD CONSTRAINT solicitacoes_certidoes_status_check 
CHECK (status IN ('pendente', 'em_analise', 'aprovada', 'rejeitada', 'entregue', 'pago'));

-- 10. CRIAR VIEW PARA RELATÓRIOS
-- ============================================================================

CREATE OR REPLACE VIEW public.view_certidoes_relatorio AS
SELECT 
    sc.id,
    sc.numero_protocolo,
    sc.tipo_certidao,
    vc.nome as tipo_nome,
    vc.valor as valor_tabela,
    sc.valor as valor_cobrado,
    sc.status,
    sc.data_solicitacao,
    sc.data_pagamento,
    sc.payment_reference,
    p.nome_completo as solicitante
FROM public.solicitacoes_certidoes sc
LEFT JOIN public.valores_certidoes vc ON sc.tipo_certidao = vc.tipo
LEFT JOIN public.profiles p ON sc.user_id = p.id;

-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.valores_certidoes IS 'Tabela de valores das certidões por tipo';
COMMENT ON FUNCTION public.calculate_certification_value IS 'Calcula valor da certidão baseado no tipo';
COMMENT ON FUNCTION public.set_certification_value IS 'Trigger para definir valor automaticamente';
COMMENT ON FUNCTION public.process_certification_payment IS 'Processa pagamento de certidão';
COMMENT ON VIEW public.view_certidoes_relatorio IS 'View para relatórios de certidões com valores';

-- ============================================================================
-- SCRIPT DE LIMPEZA E CORREÇÃO CONCLUÍDO
-- ============================================================================

SELECT 'Sistema de Certidões limpo e recriado com sucesso!' as resultado,
       (SELECT COUNT(*) FROM public.valores_certidoes) as tipos_certidao_criados;