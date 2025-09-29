-- Script para corrigir o email do perfil administrativo
-- Execute este script no Editor SQL do Supabase

-- Atualizar o email do perfil administrativo
UPDATE profiles 
SET email = 'rcarrarocoach@gmail.com'
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a' 
  AND cargo = 'Administrador';

-- Verificar se a atualização funcionou
SELECT 
  id,
  nome_completo,
  email,
  cargo,
  status
FROM profiles 
WHERE id = 'c2e01b5c-f6af-4906-94e3-ea7cdf1ec02a';