-- Script simples para configurar admin
-- Usuário: rcarrarocoach@gmail.com (UUID: c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a)

-- 1. Tornar usuário admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Garantir que o perfil existe
INSERT INTO public.profiles (id, nome_completo, status)
VALUES (
  'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a',
  'Renato Magno Carraro Alves',
  'ativo'
)
ON CONFLICT (id) DO UPDATE SET
  status = 'ativo';

-- 3. Verificar se foi configurado corretamente
SELECT 
  'Configuração concluída' as resultado,
  EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a' 
    AND role = 'admin'::app_role
  ) as is_admin;