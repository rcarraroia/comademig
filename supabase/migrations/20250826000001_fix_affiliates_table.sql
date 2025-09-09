-- Correção da tabela de afiliados
-- Problema: asaas_wallet_id estava definido como UUID, mas deve ser TEXT
-- Wallet IDs da Asaas são strings, não UUIDs

-- 1. Alterar o tipo da coluna asaas_wallet_id de UUID para TEXT
ALTER TABLE public.affiliates 
ALTER COLUMN asaas_wallet_id TYPE TEXT;

-- 2. Tornar display_name e cpf_cnpj obrigatórios (NOT NULL)
-- Primeiro, atualizar registros existentes que possam ter valores nulos
UPDATE public.affiliates 
SET display_name = 'Nome não informado' 
WHERE display_name IS NULL OR display_name = '';

UPDATE public.affiliates 
SET cpf_cnpj = '000.000.000-00' 
WHERE cpf_cnpj IS NULL OR cpf_cnpj = '';

-- Agora aplicar a constraint NOT NULL
ALTER TABLE public.affiliates 
ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE public.affiliates 
ALTER COLUMN cpf_cnpj SET NOT NULL;

-- 3. Adicionar constraint para validar formato do Wallet ID (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_asaas_wallet_id_format'
        AND table_name = 'affiliates'
    ) THEN
        ALTER TABLE public.affiliates 
        ADD CONSTRAINT check_asaas_wallet_id_format 
        CHECK (length(asaas_wallet_id) > 0 AND asaas_wallet_id ~ '^[a-zA-Z0-9\-]+$');
        
        RAISE NOTICE 'Constraint check_asaas_wallet_id_format criada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint check_asaas_wallet_id_format já existe, pulando criação';
    END IF;
END $$;

-- 4. Comentários para documentação
COMMENT ON COLUMN public.affiliates.asaas_wallet_id IS 'Wallet ID da Asaas (formato string) para recebimento de comissões';
COMMENT ON COLUMN public.affiliates.display_name IS 'Nome de exibição do afiliado (obrigatório)';
COMMENT ON COLUMN public.affiliates.cpf_cnpj IS 'CPF ou CNPJ do afiliado (obrigatório)';