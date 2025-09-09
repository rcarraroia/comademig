-- ============================================================================
-- ADICIONAR CAMPOS DE SERVIÇO À TABELA ASAAS_COBRANCAS
-- Data: 08/09/2025
-- Objetivo: Suportar diferentes tipos de serviço na edge function de pagamento
-- ============================================================================

-- 1. ADICIONAR COLUNAS PARA TIPOS DE SERVIÇO
-- ============================================================================

DO $$
BEGIN
    -- Adicionar service_type se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asaas_cobrancas' 
        AND column_name = 'service_type'
    ) THEN
        ALTER TABLE public.asaas_cobrancas 
        ADD COLUMN service_type TEXT CHECK (service_type IN ('certidao', 'regularizacao', 'filiacao', 'taxa_anual', 'outros', 'evento', 'doacao'));
        
        COMMENT ON COLUMN public.asaas_cobrancas.service_type IS 'Tipo de serviço: certidao, regularizacao, filiacao, taxa_anual';
    END IF;

    -- Adicionar service_data se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asaas_cobrancas' 
        AND column_name = 'service_data'
    ) THEN
        ALTER TABLE public.asaas_cobrancas 
        ADD COLUMN service_data JSONB;
        
        COMMENT ON COLUMN public.asaas_cobrancas.service_data IS 'Dados específicos do serviço em formato JSON';
    END IF;
END $$;

-- 2. ATUALIZAR REGISTROS EXISTENTES
-- ============================================================================

-- Atualizar service_type baseado no tipo_cobranca existente
UPDATE public.asaas_cobrancas 
SET service_type = tipo_cobranca 
WHERE service_type IS NULL AND tipo_cobranca IS NOT NULL;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para service_type
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_service_type 
ON public.asaas_cobrancas(service_type);

-- Índice composto para consultas por usuário e tipo de serviço
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_user_service 
ON public.asaas_cobrancas(user_id, service_type);

-- Índice para service_data usando GIN (para consultas JSON)
CREATE INDEX IF NOT EXISTS idx_asaas_cobrancas_service_data 
ON public.asaas_cobrancas USING GIN (service_data);

-- 4. CRIAR FUNÇÃO PARA EXTRAIR DADOS DO SERVIÇO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_service_data_field(
    service_data_param JSONB,
    field_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF service_data_param IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN service_data_param ->> field_name;
END;
$$;

COMMENT ON FUNCTION public.get_service_data_field IS 'Extrai um campo específico dos dados do serviço';

-- 5. CRIAR VIEW PARA FACILITAR CONSULTAS
-- ============================================================================

CREATE OR REPLACE VIEW public.asaas_cobrancas_with_service_info AS
SELECT 
    ac.*,
    CASE 
        WHEN ac.service_type = 'certidao' THEN ac.service_data ->> 'tipo_certidao'
        WHEN ac.service_type = 'regularizacao' THEN 'Regularização de Igreja'
        WHEN ac.service_type = 'filiacao' THEN 'Filiação COMADEMIG'
        ELSE ac.service_type
    END as service_description,
    ac.service_data ->> 'tipo_certidao' as certidao_tipo,
    ac.service_data ->> 'justificativa' as certidao_justificativa,
    (ac.service_data ->> 'servicos_selecionados')::jsonb as regularizacao_servicos,
    ac.service_data ->> 'member_type_id' as filiacao_member_type,
    ac.service_data ->> 'subscription_plan_id' as filiacao_plan
FROM public.asaas_cobrancas ac;

COMMENT ON VIEW public.asaas_cobrancas_with_service_info IS 'View com informações detalhadas dos serviços';

-- 6. ATUALIZAR POLÍTICAS RLS SE NECESSÁRIO
-- ============================================================================

-- As políticas existentes já cobrem as novas colunas, mas vamos garantir
-- que a view também tenha as mesmas políticas

-- Política para usuários verem suas próprias cobranças
DROP POLICY IF EXISTS "Users can view own charges with service info" ON public.asaas_cobrancas_with_service_info;

-- Note: Views herdam as políticas RLS da tabela base automaticamente

-- 7. CRIAR FUNÇÃO PARA VALIDAR SERVICE_DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_service_data(
    service_type_param TEXT,
    service_data_param JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se não há dados de serviço, é válido
    IF service_data_param IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Validar baseado no tipo de serviço
    CASE service_type_param
        WHEN 'certidao' THEN
            -- Certidão deve ter tipo_certidao
            RETURN service_data_param ? 'tipo_certidao';
            
        WHEN 'regularizacao' THEN
            -- Regularização deve ter servicos_selecionados
            RETURN service_data_param ? 'servicos_selecionados';
            
        WHEN 'filiacao' THEN
            -- Filiação deve ter member_type_id e subscription_plan_id
            RETURN (service_data_param ? 'member_type_id') AND 
                   (service_data_param ? 'subscription_plan_id');
                   
        ELSE
            -- Outros tipos são válidos sem validação específica
            RETURN TRUE;
    END CASE;
END;
$$;

COMMENT ON FUNCTION public.validate_service_data IS 'Valida se os dados do serviço estão corretos para o tipo';

-- 8. ADICIONAR TRIGGER PARA VALIDAÇÃO (OPCIONAL)
-- ============================================================================

-- Função do trigger
CREATE OR REPLACE FUNCTION public.validate_service_data_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar dados do serviço se fornecidos
    IF NEW.service_type IS NOT NULL AND NEW.service_data IS NOT NULL THEN
        IF NOT public.validate_service_data(NEW.service_type, NEW.service_data) THEN
            RAISE EXCEPTION 'Dados do serviço inválidos para o tipo %', NEW.service_type;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger (comentado por enquanto para não quebrar inserções existentes)
-- CREATE TRIGGER validate_service_data_before_insert
--     BEFORE INSERT OR UPDATE ON public.asaas_cobrancas
--     FOR EACH ROW
--     EXECUTE FUNCTION public.validate_service_data_trigger();

-- 9. ESTATÍSTICAS E VERIFICAÇÃO
-- ============================================================================

-- Mostrar estatísticas das alterações
SELECT 
    'Migração concluída!' as status,
    COUNT(*) as total_cobrancas,
    COUNT(service_type) as cobrancas_com_service_type,
    COUNT(service_data) as cobrancas_com_service_data
FROM public.asaas_cobrancas;

-- Mostrar distribuição por tipo de serviço
SELECT 
    COALESCE(service_type, 'NULL') as service_type,
    COUNT(*) as quantidade
FROM public.asaas_cobrancas 
GROUP BY service_type
ORDER BY quantidade DESC;