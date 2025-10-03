-- ============================================================================
-- MIGRAÇÃO: Funções auxiliares para integração Asaas
-- Data: 2025-03-10
-- Descrição: Cria funções SQL para contornar problemas de tipos temporários
-- ============================================================================

-- 1. FUNÇÃO: Buscar customer_id do usuário
CREATE OR REPLACE FUNCTION get_user_asaas_customer(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_id TEXT;
BEGIN
    SELECT asaas_customer_id INTO customer_id
    FROM asaas_customers
    WHERE user_id = p_user_id
    LIMIT 1;
    
    RETURN customer_id;
END;
$$;

-- 2. FUNÇÃO: Buscar dados do perfil para criar cliente
CREATE OR REPLACE FUNCTION get_profile_for_customer(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data JSON;
BEGIN
    SELECT json_build_object(
        'full_name', full_name,
        'cpf_cnpj', cpf_cnpj,
        'email', email,
        'phone', phone,
        'mobile_phone', mobile_phone,
        'address', address,
        'address_number', address_number,
        'complement', complement,
        'neighborhood', neighborhood,
        'postal_code', postal_code,
        'city', city,
        'state', state
    ) INTO profile_data
    FROM profiles
    WHERE id = p_user_id;
    
    RETURN profile_data;
END;
$$;

-- 3. FUNÇÃO: Verificar se usuário tem dados completos para criar cliente
CREATE OR REPLACE FUNCTION check_user_profile_completeness(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    profile_record RECORD;
    missing_fields TEXT[] := '{}';
BEGIN
    SELECT full_name, cpf_cnpj, email
    INTO profile_record
    FROM profiles
    WHERE id = p_user_id;
    
    IF profile_record.full_name IS NULL OR profile_record.full_name = '' THEN
        missing_fields := array_append(missing_fields, 'full_name');
    END IF;
    
    IF profile_record.cpf_cnpj IS NULL OR profile_record.cpf_cnpj = '' THEN
        missing_fields := array_append(missing_fields, 'cpf_cnpj');
    END IF;
    
    IF profile_record.email IS NULL OR profile_record.email = '' THEN
        missing_fields := array_append(missing_fields, 'email');
    END IF;
    
    SELECT json_build_object(
        'is_complete', array_length(missing_fields, 1) = 0,
        'missing_fields', missing_fields,
        'profile_data', json_build_object(
            'full_name', profile_record.full_name,
            'cpf_cnpj', profile_record.cpf_cnpj,
            'email', profile_record.email
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 4. FUNÇÃO: Atualizar customer_id no perfil
CREATE OR REPLACE FUNCTION update_user_asaas_customer(p_user_id UUID, p_customer_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET asaas_customer_id = p_customer_id,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- 5. GRANTS para as funções
GRANT EXECUTE ON FUNCTION get_user_asaas_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_for_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_profile_completeness(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_asaas_customer(UUID, TEXT) TO authenticated;

-- ============================================================================
-- FUNÇÕES AUXILIARES CRIADAS COM SUCESSO!
-- 
-- Funções disponíveis:
-- - get_user_asaas_customer: Busca customer_id do usuário
-- - get_profile_for_customer: Busca dados do perfil
-- - check_user_profile_completeness: Verifica completude do perfil
-- - update_user_asaas_customer: Atualiza customer_id no perfil
-- ============================================================================