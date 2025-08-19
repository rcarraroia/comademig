
-- Ativar o usuário Renato como membro ativo
UPDATE public.profiles 
SET status = 'ativo', tipo_membro = 'membro'
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';

-- Verificar se o update foi aplicado
SELECT id, nome_completo, status, tipo_membro 
FROM public.profiles 
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';
