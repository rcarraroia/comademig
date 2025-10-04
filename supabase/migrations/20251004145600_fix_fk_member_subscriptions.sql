-- Tarefa 2.2 (CORRIGIDA): Limpa referências órfãs e restaura a Chave Estrangeira (FK).

-- 1. Limpa os IDs de planos de assinatura órfãos.
-- Define como NULL qualquer subscription_plan_id que não exista na tabela subscription_plans.
-- Isso é necessário porque o script anterior recriou todos os planos, invalidando os IDs antigos.
UPDATE public.member_type_subscriptions
SET subscription_plan_id = NULL
WHERE subscription_plan_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM public.subscription_plans
    WHERE id = public.member_type_subscriptions.subscription_plan_id
);

-- 2. Remove a constraint antiga se ela existir, para evitar erros.
ALTER TABLE public.member_type_subscriptions
DROP CONSTRAINT IF EXISTS member_type_subscriptions_subscription_plan_id_fkey;

-- 3. Adiciona a chave estrangeira, agora com os dados consistentes.
ALTER TABLE public.member_type_subscriptions
ADD CONSTRAINT member_type_subscriptions_subscription_plan_id_fkey
FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id)
ON DELETE SET NULL;

-- Confirmação de que o script foi criado.
-- A execução real deve ser feita manualmente no painel do Supabase.