-- Script APENAS para configurar admin
-- Usuário: rcarrarocoach@gmail.com
-- UUID: c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a

-- 1. Configurar usuário como admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Garantir que o perfil existe (apenas campos obrigatórios)
INSERT INTO public.profiles (id, nome_completo)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',
  'Renato Magno Carraro Alves'
)
ON CONFLICT (id) DO UPDATE SET
  nome_completo = EXCLUDED.nome_completo;

-- 3. Atualizar status para ativo (se a coluna existir)
UPDATE public.profiles 
SET status = 'ativo'
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';

-- 4. Verificar se foi configurado corretamente
SELECT 
  'Admin configurado com sucesso!' as resultado,
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a' 
    AND role = 'admin'::app_role
  ) as is_admin,
  (SELECT nome_completo FROM profiles WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a') as nome;