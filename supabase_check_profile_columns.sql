-- VERIFICAR COLUNAS DA TABELA PROFILES
-- Execute para verificar se todas as colunas necessárias existem

-- Verificar todas as colunas da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar especificamente as colunas do perfil público
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'show_contact') 
        THEN 'show_contact: EXISTS' 
        ELSE 'show_contact: MISSING' 
    END as show_contact_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'show_ministry') 
        THEN 'show_ministry: EXISTS' 
        ELSE 'show_ministry: MISSING' 
    END as show_ministry_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') 
        THEN 'bio: EXISTS' 
        ELSE 'bio: MISSING' 
    END as bio_status;