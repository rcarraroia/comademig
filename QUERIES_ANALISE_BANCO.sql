-- ============================================================================
-- QUERIES PARA ANÁLISE DO ESTADO ATUAL DO BANCO
-- Execute cada query separadamente no painel do Supabase
-- ============================================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'asaas_cobrancas' 
ORDER BY ordinal_position;

-- 2. VERIFICAR CONSTRAINTS EXISTENTES (CORRIGIDO)
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'asaas_cobrancas';

-- 3. CONTAR REGISTROS TOTAL
SELECT COUNT(*) as total_registros FROM asaas_cobrancas;

-- 4. VERIFICAR VALORES ÚNICOS EM tipo_cobranca
SELECT 
    COALESCE(tipo_cobranca, 'NULL') as tipo_cobranca, 
    COUNT(*) as quantidade
FROM asaas_cobrancas 
GROUP BY tipo_cobranca 
ORDER BY quantidade DESC;

-- 5. VERIFICAR SE JÁ EXISTEM AS NOVAS COLUNAS
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asaas_cobrancas' AND column_name = 'service_type'
    ) THEN 'SIM' ELSE 'NÃO' END as service_type_exists,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asaas_cobrancas' AND column_name = 'service_data'
    ) THEN 'SIM' ELSE 'NÃO' END as service_data_exists;

-- 6. MOSTRAR ALGUNS REGISTROS DE EXEMPLO (se existirem)
SELECT 
    id, 
    tipo_cobranca, 
    valor, 
    status, 
    created_at
FROM asaas_cobrancas 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'asaas_cobrancas';

-- 8. VERIFICAR ÍNDICES EXISTENTES
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'asaas_cobrancas';