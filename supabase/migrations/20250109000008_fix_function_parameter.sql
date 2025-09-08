-- ============================================================================
-- CORREÇÃO DA FUNÇÃO CALCULATE_CERTIFICATION_VALUE
-- ============================================================================

-- Remover função existente
DROP FUNCTION IF EXISTS public.calculate_certification_value(TEXT);

-- Recriar função com parâmetro correto
CREATE OR REPLACE FUNCTION public.calculate_certification_value(certification_type TEXT)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $function$
DECLARE
    valor_certidao DECIMAL(10,2);
BEGIN
    -- Buscar valor na tabela
    SELECT valor INTO valor_certidao
    FROM public.valores_certidoes 
    WHERE tipo = certification_type AND is_active = true;
    
    -- Se não encontrar, usar valor padrão
    IF valor_certidao IS NULL THEN
        valor_certidao := 45.00; -- Valor padrão
    END IF;
    
    RETURN valor_certidao;
END;
$function$;

-- Atualizar função trigger para usar o nome correto
CREATE OR REPLACE FUNCTION public.set_certification_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Definir valor baseado no tipo se não foi fornecido
    IF NEW.valor IS NULL THEN
        NEW.valor := public.calculate_certification_value(NEW.tipo_certidao);
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Testar a função
SELECT 'Função corrigida!' as resultado,
       public.calculate_certification_value('ministerio') as teste_ministerio,
       public.calculate_certification_value('vinculo') as teste_vinculo;