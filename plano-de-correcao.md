# 📝 SOLICITAÇÃO DE CORREÇÃO PARA O MODO CÓDIGO (KIRO DEV)

**PARA:** Kiro Dev (Modo Código)
**DE:** Kilo Code (Modo Arquiteto)
**DATA:** 04/10/2025
**ASSUNTO:** Execução do Plano de Correção Crítica do Sistema COMADEMIG

---

## 🚨 ATUALIZAÇÃO URGENTE 3 - ERRO DE CHAVE ESTRANGEIRA 🚨

A execução do script `20251004145600_fix_fk_member_subscriptions.sql` falhou com o erro: `violates foreign key constraint... Key ... is not present in table "subscription_plans"`.

**Causa Raiz:** Minha falha de planejamento. O script que recriou os dados em `subscription_plans` deixou referências órfãs (IDs antigos) na tabela `member_type_subscriptions`. Não podemos criar uma chave estrangeira em dados inconsistentes.

**Ação Imediata Requerida:** Corrija o script de migração da chave estrangeira para limpar os dados órfãos antes de criar a constraint.

### **Tarefa de Correção Urgente**

**Objetivo:** Corrigir o arquivo de migração para garantir a integridade dos dados antes de criar a chave estrangeira.

**Arquivo a ser modificado:** `supabase/migrations/20251004145600_fix_fk_member_subscriptions.sql`

**Instrução:** Substitua o conteúdo do arquivo pelo script abaixo. Este script primeiro define como `NULL` todas as referências a `subscription_plan_id` que não existem mais, e SÓ ENTÃO cria a chave estrangeira.

```sql
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
```

---
## Plano de Ação Original (Aguardando correção acima)

*O restante do plano de correção permanece o mesmo e deve ser seguido após a correção do script.*