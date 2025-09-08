-- ============================================================================
-- MIGRAÇÃO SEGURA - ADICIONAR CAMPOS DE SERVIÇO (BASEADA EM ANÁLISE REAL)
-- Data: 08/09/2025
-- Estado atual: 2 registros ('outros': 1, 'filiacao': 1)
-- Colunas service_type e service_data: NÃO EXISTEM
-- ============================================================================

-- 1. ADICIONAR NOVAS COLUNAS SEM CONSTRAINTS RESTRITIVOS
-- ============================================================================

-- Adicionar service_type (permitindo valores existentes + novos)
ALTER TABLE public.asaas_cobrancas 
ADD COLUMN service_type TEXT;

-- Adicionar service_data para dados JSON específicos do serviço
ALTER TABLE public.asaas_cobrancas 
ADD COLUMN service_data JSONB;

-- Adicionar comentários
COMMENT ON COLUMN public.asaas_cobrancas.service_type IS 'Tipo de serviço baseado em tipo_cobranca';
COMMENT ON COLUMN public.asaas_cobrancas.service_data IS 'Dados específicos do serviço em formato JSON';

-- 2. ATUALIZAR REGISTROS EXISTENTES
-- ============================================================================

-- Copiar valores de tipo_cobranca para service_type
UPDATE public.asaas_cobrancas 
SET service_type = tipo_cobranca 
WHERE service_type IS NULL;

-- 3. CRIAR CONSTRAINT INCLUINDO VALORES EXISTENTES + NOVOS
-- ============================================================================

-- Constraint que inclui valores existentes ('outros', 'filiacao') + valores futuros
ALTER TABLE public.asaas_cobrancas 
ADD CONSTRAINT asaas_cobrancas_service_type_check 
CHECK (service_type IN (
    'outros',           -- Valor existente
    'filiacao',         -- Valor existente  
    'certidao',         -- Novo valor
    'regularizacao',    -- Novo valor
    'taxa_anual',       -- Novo valor
    'evento',           -- Valor adicional
    'doacao'            -- Valor adicional
));

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para service_type
CREATE INDEX idx_asaas_cobrancas_service_type 
ON public.asaas_cobrancas(service_type);

-- Índice composto para consultas por usuário e tipo de serviço
CREATE INDEX idx_asaas_cobrancas_user_service 
ON public.asaas_cobrancas(user_id, service_type);

-- Índice para service_data usando GIN (para consultas JSON eficientes)
CREATE INDEX idx_asaas_cobrancas_service_data 
ON public.asaas_cobrancas USING GIN (service_data);

-- 5. CRIAR FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para extrair campos específicos dos dados JSON
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

-- 6. CRIAR VIEW PARA FACILITAR CONSULTAS
-- ============================================================================

CREATE OR REPLACE VIEW public.asaas_cobrancas_with_service_info AS
SELECT 
    ac.*,
    -- Descrição amigável baseada no tipo de serviço
    CASE 
        WHEN ac.service_type = 'certidao' THEN 
            COALESCE(ac.service_data ->> 'tipo_certidao', 'Certidão')
        WHEN ac.service_type = 'regularizacao' THEN 
            'Regularização de Igreja'
        WHEN ac.service_type = 'filiacao' THEN 
            'Filiação COMADEMIG'
        WHEN ac.service_type = 'taxa_anual' THEN 
            'Taxa Anual'
        WHEN ac.service_type = 'outros' THEN 
            'Outros Serviços'
        WHEN ac.service_type = 'evento' THEN 
            'Evento'
        WHEN ac.service_type = 'doacao' THEN 
            'Doação'
        ELSE 
            COALESCE(ac.service_type, 'Não Especificado')
    END as service_description,
    
    -- Campos específicos de certidão
    ac.service_data ->> 'tipo_certidao' as certidao_tipo,
    ac.service_data ->> 'justificativa' as certidao_justificativa,
    
    -- Campos específicos de regularização
    (ac.service_data ->> 'servicos_selecionados')::jsonb as regularizacao_servicos,
    
    -- Campos específicos de filiação
    ac.service_data ->> 'member_type_id' as filiacao_member_type,
    ac.service_data ->> 'subscription_plan_id' as filiacao_plan
    
FROM public.asaas_cobrancas ac;

COMMENT ON VIEW public.asaas_cobrancas_with_service_info IS 'View com informações detalhadas dos serviços por tipo';

-- 7. CRIAR FUNÇÃO DE VALIDAÇÃO
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

-- 8. VERIFICAÇÕES E ESTATÍSTICAS FINAIS
-- ============================================================================

-- Verificar se a migração foi bem-sucedida
SELECT 
    'Migração executada com sucesso!' as status,
    COUNT(*) as total_cobrancas,
    COUNT(service_type) as cobrancas_com_service_type,
    COUNT(service_data) as cobrancas_com_service_data
FROM public.asaas_cobrancas;

-- Mostrar distribuição atualizada por tipo de serviço
SELECT 
    'Distribuição por tipo de serviço:' as info;

SELECT 
    COALESCE(service_type, 'NULL') as service_type,
    COUNT(*) as quantidade
FROM public.asaas_cobrancas 
GROUP BY service_type
ORDER BY quantidade DESC;

-- Verificar constraint criado
SELECT 
    'Constraint criado com valores:' as info;

SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'asaas_cobrancas_service_type_check';

-- Verificar índices criados
SELECT 
    'Novos índices criados:' as info;

SELECT 
    indexname
FROM pg_indexes 
WHERE tablename = 'asaas_cobrancas' 
AND indexname LIKE '%service%';

-- 9. MENSAGEM FINAL
-- ============================================================================

SELECT 
    '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as resultado,
    '✅ Colunas service_type e service_data adicionadas' as coluna_1,
    '✅ Registros existentes atualizados' as coluna_2,
    '✅ Constraint criado incluindo valores existentes' as coluna_3,
    '✅ Índices criados para performance' as coluna_4,
    '✅ Funções e view criadas' as coluna_5,
    '🚀 Edge function pode usar novos campos!' as proximo_passo;