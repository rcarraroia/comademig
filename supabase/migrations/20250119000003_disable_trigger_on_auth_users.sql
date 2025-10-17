-- Desabilitar trigger que está causando erro
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Trigger on_auth_user_created DESABILITADO';
  RAISE NOTICE 'Cadastros agora funcionarão';
END $$;
