-- DIAGNÓSTICO COMPLETO DO SISTEMA DE AFILIADOS

-- 1. Último usuário cadastrado
SELECT 
  id,
  nome_completo,
  email,
  status,
  tipo_membro,
  member_type_id,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 1;
