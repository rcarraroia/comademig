-- SCRIPT MINIMAL: APENAS ACESSO ADMIN
-- Remove TODAS as referências a colunas que podem não existir
-- Foca APENAS no essencial: tornar o usuário admin

-- 1. Garantir que o usuário tem uma role admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Criar perfil básico SEM email (apenas campos obrigatórios)
INSERT INTO public.profiles (id, nome_completo) 
VALUES ('c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', 'Renato Magno Carraro Alves')
ON CONFLICT (id) DO UPDATE SET 
  nome_completo = EXCLUDED.nome_completo;

-- 3. Verificar se funcionou
SELECT 
  p.id,
  p.nome_completo,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';