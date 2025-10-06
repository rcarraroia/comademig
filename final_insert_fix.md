# 🚨 CORREÇÃO FINAL E ISOLADA: Inserção de Dados dos Planos de Assinatura

**PARA:** Usuário
**DE:** Kilo Code (Arquiteto)
**ASSUNTO:** Comando SQL final para popular a tabela `subscription_plans`

---

## Diagnóstico

A verificação final confirmou que a tabela `subscription_plans` permanece vazia, o que impede o funcionamento do painel administrativo. A migração anterior falhou em inserir os dados.

## Solução

Abaixo está um comando `INSERT` puro. Ele não contém lógicas complexas e tem um único objetivo: adicionar os 5 planos de assinatura necessários à tabela.

### ⚠️ AÇÃO MANUAL FINAL NECESSÁRIA

Por favor, copie e execute o comando SQL abaixo diretamente no seu editor SQL do Supabase.

```sql
-- Comando de inserção final e isolado para a tabela subscription_plans

INSERT INTO public.subscription_plans (name, description, price, recurrence, is_active)
VALUES
  ('Plano Obreiro', 'Plano de contribuição mensal para Obreiros.', 50.00, 'monthly', true),
  ('Plano Evangelista', 'Plano de contribuição mensal para Evangelistas.', 50.00, 'monthly', true),
  ('Plano Pastor', 'Plano de contribuição mensal para Pastores.', 70.00, 'monthly', true),
  ('Plano Missionário', 'Plano de contribuição mensal para Missionários.', 50.00, 'monthly', true),
  ('Plano Ministro', 'Plano de contribuição mensal para Ministros de Evangelho.', 100.00, 'monthly', true);
```

---

Após a execução deste comando, a tabela `subscription_plans` terá os dados necessários, e o problema do painel administrativo será resolvido.