-- CORRIGIR: Definir tipo_membro como 'admin' na tabela profiles
-- A aplicação verifica se profile.tipo_membro === 'admin'

UPDATE public.profiles 
SET tipo_membro = 'admin', status = 'ativo'
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';

-- Verificar se funcionou
SELECT 
  id,
  nome_completo,
  tipo_membro,
  status,
  cargo
FROM public.profiles 
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';