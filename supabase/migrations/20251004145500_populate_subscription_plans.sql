-- Tarefa 2.1 (CORRIGIDA): Popula a tabela 'subscription_plans' com os dados essenciais.

-- Limpa a tabela antes de inserir para evitar duplicatas em caso de re-execução
TRUNCATE TABLE public.subscription_plans RESTART IDENTITY CASCADE;

-- Insere os planos de assinatura sem tentar associá-los diretamente a um tipo de membro.
INSERT INTO public.subscription_plans (name, description, price, recurrence, is_active)
VALUES
  ('Plano Obreiro', 'Plano de contribuição mensal para Obreiros.', 50.00, 'monthly', true),
  ('Plano Evangelista', 'Plano de contribuição mensal para Evangelistas.', 50.00, 'monthly', true),
  ('Plano Pastor', 'Plano de contribuição mensal para Pastores.', 70.00, 'monthly', true),
  ('Plano Missionário', 'Plano de contribuição mensal para Missionários.', 50.00, 'monthly', true),
  ('Plano Ministro', 'Plano de contribuição mensal para Ministros de Evangelho.', 100.00, 'monthly', true);

-- Confirmação de que o script foi criado.
-- A execução real deve ser feita manualmente no painel do Supabase.