-- Tarefa 1.1: Garante a existência da função get_user_roles()
-- Esta função é essencial para as políticas de segurança baseadas em roles.

CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS text[] AS $$
DECLARE
  v_roles text[];
BEGIN
  SELECT ARRAY_AGG(role)
  INTO v_roles
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  RETURN v_roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirmação de que o script foi criado.
-- A execução real deve ser feita manualmente no painel do Supabase.