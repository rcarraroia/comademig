-- =====================================================
-- MIGRAÇÃO 005: Remover Cargo "Administrador" Incorreto
-- Data: 10/12/2024
-- Descrição: Remove cargo "Administrador" que não é um cargo ministerial
-- Sistema: COMADEMIG - Convenção de Ministros das Assembleias de Deus em MG
-- =====================================================

-- PASSO 1: Verificar se existe cargo "Administrador"
DO $$
DECLARE
    admin_member_type_id UUID;
    admin_plans_count INTEGER;
BEGIN
    -- Buscar ID do cargo Administrador
    SELECT id INTO admin_member_type_id
    FROM member_types 
    WHERE name ILIKE '%administrador%' OR name ILIKE '%admin%'
    LIMIT 1;
    
    IF admin_member_type_id IS NOT NULL THEN
        RAISE NOTICE 'Cargo Administrador encontrado: %', admin_member_type_id;
        
        -- Contar planos associados
        SELECT COUNT(*) INTO admin_plans_count
        FROM subscription_plans
        WHERE member_type_id = admin_member_type_id;
        
        RAISE NOTICE 'Planos associados ao Administrador: %', admin_plans_count;
        
        -- Verificar se há usuários com este cargo
        DECLARE
            users_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO users_count
            FROM profiles
            WHERE member_type_id = admin_member_type_id;
            
            IF users_count > 0 THEN
                RAISE WARNING 'ATENÇÃO: % usuários têm o cargo Administrador. Considere migrar para outro cargo antes de remover.', users_count;
            ELSE
                RAISE NOTICE 'Nenhum usuário possui o cargo Administrador. Seguro para remoção.';
            END IF;
        END;
        
    ELSE
        RAISE NOTICE 'Cargo Administrador não encontrado. Nenhuma ação necessária.';
        RETURN;
    END IF;
END $$;

-- PASSO 2: Remover planos associados ao cargo Administrador
DELETE FROM subscription_plans 
WHERE member_type_id IN (
    SELECT id FROM member_types 
    WHERE name ILIKE '%administrador%' OR name ILIKE '%admin%'
);

-- PASSO 3: Atualizar usuários que possam ter este cargo (mover para cargo padrão)
DO $$
DECLARE
    admin_member_type_id UUID;
    default_member_type_id UUID;
    updated_users INTEGER;
BEGIN
    -- Buscar ID do cargo Administrador
    SELECT id INTO admin_member_type_id
    FROM member_types 
    WHERE name ILIKE '%administrador%' OR name ILIKE '%admin%'
    LIMIT 1;
    
    -- Buscar um cargo padrão (Membro ou Pastor)
    SELECT id INTO default_member_type_id
    FROM member_types 
    WHERE name IN ('Membro', 'Pastor', 'Diácono')
    AND is_active = true
    ORDER BY 
        CASE name 
            WHEN 'Membro' THEN 1
            WHEN 'Pastor' THEN 2
            WHEN 'Diácono' THEN 3
            ELSE 4
        END
    LIMIT 1;
    
    IF admin_member_type_id IS NOT NULL AND default_member_type_id IS NOT NULL THEN
        -- Atualizar usuários
        UPDATE profiles 
        SET member_type_id = default_member_type_id,
            updated_at = NOW()
        WHERE member_type_id = admin_member_type_id;
        
        GET DIAGNOSTICS updated_users = ROW_COUNT;
        RAISE NOTICE 'Usuários migrados do cargo Administrador: %', updated_users;
    END IF;
END $$;

-- PASSO 4: Remover o cargo Administrador
DELETE FROM member_types 
WHERE name ILIKE '%administrador%' OR name ILIKE '%admin%';

-- PASSO 5: Verificar resultado
SELECT 
    'Cargos restantes:' as info,
    COUNT(*) as total_member_types
FROM member_types
WHERE is_active = true;

SELECT 
    'Planos restantes:' as info,
    COUNT(*) as total_plans,
    COUNT(DISTINCT member_type_id) as member_types_with_plans
FROM subscription_plans
WHERE is_active = true;

-- PASSO 6: Listar cargos válidos restantes
SELECT 
    mt.name as cargo,
    COUNT(sp.id) as total_planos,
    STRING_AGG(sp.duration_months::text || ' meses', ', ' ORDER BY sp.duration_months) as durações
FROM member_types mt
LEFT JOIN subscription_plans sp ON mt.id = sp.member_type_id
WHERE mt.is_active = true
GROUP BY mt.id, mt.name
ORDER BY mt.name;

-- =====================================================
-- FIM DA MIGRAÇÃO 005 - REMOÇÃO DO CARGO ADMINISTRADOR
-- 
-- ✅ Cargo "Administrador" removido
-- ✅ Planos associados removidos
-- ✅ Usuários migrados para cargo válido
-- ✅ Sistema limpo de cargos não ministeriais
-- =====================================================