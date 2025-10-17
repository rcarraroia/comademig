# Implementation Plan - Correção Sistema de Filiação e Integração Asaas

## 📊 LEGENDA DE STATUS
- `[ ]` = Não iniciado
- `[~]` = **Implementado mas NÃO testado/validado**
- `[x]` = Testado e validado pelo usuário

## 📈 PROGRESSO ATUAL
- **Total de tarefas:** 32
- **Implementadas:** 18 tarefas [~]
- **Validadas:** 1 tarefa [x] (Tarefa 20 - sem dados para migrar)
- **Não iniciadas:** 10 tarefas [ ]
- **Canceladas:** 3 tarefas (19-PIX, 21-22-23 antigas)
- **Progresso de implementação:** 56%
- **Progresso de validação:** 3%

## ⚠️ PRÓXIMOS PASSOS CRÍTICOS
1. **Fase 6: Limpeza e Consolidação** - Limpar tabelas duplicadas, migrações com erro, arquivos temporários
2. **Aplicar migrações no banco** via `supabase db push`
3. **Fase 7: Testes e Validação** - Testar fluxo completo de filiação
4. **Configurar webhooks** no dashboard Asaas (manual)

## Fase 1: Correções Críticas e Preparação do Banco

- [~] 1. Corrigir trigger sync_user_role_to_metadata
  - ✅ Migração criada: `20251014000001_fix_triggers_and_foreign_keys.sql`
  - ✅ Trigger removido (causava deadlock)
  - ✅ Trigger handle_new_user corrigido com tratamento de erro
  - ✅ Foreign key profiles_id_fkey tornada DEFERRABLE
  - ✅ Trigger audit_profiles corrigido para não bloquear DELETE
  - ⚠️ **PENDENTE:** Testar cadastro de novo usuário
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [~] 2. Criar tabela webhook_events
  - ✅ Migração criada: `20251016044919_update_webhook_events_structure.sql`
  - ✅ Estrutura completa com campos: id, asaas_event_id, event_type, payload, processed, etc
  - ✅ Índices para performance adicionados
  - ✅ RLS policies criadas (apenas service_role)
  - ⚠️ **PENDENTE:** Verificar tabela no banco via SQL
  - _Requirements: 4.1, 4.7_

- [~] 3. Atualizar tabela user_subscriptions
  - ✅ Migração criada: `20251016042413_update_user_subscriptions_fields.sql`
  - ✅ Campos adicionados: initial_payment_id, asaas_customer_id, billing_type, cycle, value
  - ✅ Constraint para status adicionado
  - ✅ Índices necessários criados
  - ⚠️ **PENDENTE:** Verificar estrutura no banco via SQL
  - _Requirements: 2.1, 2.2, 2.4_

- [~] 4. Atualizar tabela asaas_splits
  - ✅ Migração criada: `20251016045536_update_asaas_splits_structure.sql`
  - ✅ Campos adicionados: subscription_id, payment_id, status, refusal_reason
  - ✅ Constraints e foreign keys atualizados
  - ✅ Índices para queries frequentes criados
  - ⚠️ **PENDENTE:** Verificar estrutura no banco via SQL
  - _Requirements: 3.1, 3.6_

- [~] 5. Corrigir RLS policies
  - ✅ Migração criada: `20251016050646_fix_rls_policies_security.sql`
  - ✅ Policy de asaas_customers atualizada (removido authenticated)
  - ✅ Policies restritivas para user_subscriptions criadas
  - ✅ Policies para asaas_splits criadas
  - ⚠️ **PENDENTE:** Testar com diferentes roles (user, admin, service_role)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Fase 2: Implementação do Sistema de Split

- [~] 6. Criar função getSplitConfiguration
  - ✅ Arquivo criado: `supabase/functions/shared/split-config.ts`
  - ✅ Função getSplitConfiguration implementada
  - ✅ Busca wallet_id da RENUM e COMADEMIG (variáveis de ambiente)
  - ✅ Busca wallet_id do afiliado (se código fornecido)
  - ✅ Calcula percentuais: 40%+40%+20% (com afiliado) ou 50%+50% (sem afiliado)
  - ✅ Retorna array de splits formatado para Asaas
  - ✅ Validação de soma de percentuais (100%)
  - ⚠️ **PENDENTE:** Testar com código de afiliado real
  - _Requirements: 3.1, 3.2, 3.3_

- [~] 7. Refatorar Edge Function asaas-create-subscription
  - ✅ Arquivo: `supabase/functions/asaas-create-subscription/index.ts`
  - ✅ Parâmetro affiliateCode adicionado na interface
  - ✅ Chama getSplitConfiguration antes de criar subscription
  - ✅ Cria cobrança imediata (initial payment) com split
  - ✅ Cria assinatura com split e nextDueDate = hoje + 30 dias
  - ✅ Salva dados em user_subscriptions
  - ✅ Registra splits em asaas_splits
  - ✅ Retorna IDs de subscription e initial payment
  - ⚠️ **PENDENTE:** Testar fluxo completo de filiação
  - _Requirements: 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.7_



- [~] 8. Adicionar validação de código de afiliado
  - ✅ Hook criado: `src/hooks/useReferralCode.ts`
  - ✅ Valida código automaticamente da URL (?ref=CODIGO)
  - ✅ Busca dados do afiliado (id, display_name, wallet_id)
  - ✅ Salva no localStorage para persistir durante cadastro
  - ✅ Validação silenciosa (sem alertas visuais)
  - ⚠️ **PENDENTE:** Testar com link de afiliado real
  - _Requirements: 5.1, 5.2, 6.6_

- [~] 9. Adicionar logs estruturados
  - ✅ Arquivo criado: `supabase/functions/shared/logger.ts`
  - ✅ Função logSubscriptionCreation implementada
  - ✅ Loga criação de subscription com todos os parâmetros
  - ✅ Loga configuração de split (walletIds, percentuais)
  - ✅ Loga erros com stack trace completo
  - ⚠️ **PENDENTE:** Verificar logs no Supabase Dashboard
  - _Requirements: 10.1, 10.3, 10.4_

## Fase 3: Implementação de Webhooks

- [~] 10. Criar Edge Function asaas-webhook
  - ✅ Arquivo criado: `supabase/functions/asaas-webhook/index.ts`
  - ✅ Estrutura básica da função implementada
  - ✅ Validação de autenticidade (asaas-access-token)
  - ✅ Verificação de idempotência (asaas_event_id)
  - ✅ Salva evento em webhook_events
  - ⚠️ **PENDENTE:** Testar recebimento de webhook real
  - _Requirements: 4.1, 4.7_

- [~] 11. Implementar processamento de PAYMENT_RECEIVED
  - ✅ Implementado em `asaas-webhook/index.ts`
  - ✅ Busca subscription pelo asaas_subscription_id
  - ✅ Atualiza status de 'pending' para 'active'
  - ✅ Atualiza started_at se for primeiro pagamento
  - ✅ Loga evento processado
  - ⚠️ **PENDENTE:** Testar com webhook real do Asaas
  - _Requirements: 4.2, 8.5_

- [~] 12. Implementar processamento de PAYMENT_CONFIRMED
  - ✅ Implementado em `asaas-webhook/index.ts`
  - ✅ Registra confirmação do pagamento
  - ✅ Atualiza dados financeiros se necessário
  - ✅ Loga evento processado
  - ⚠️ **PENDENTE:** Testar com webhook real do Asaas
  - _Requirements: 4.3_

- [~] 13. Implementar processamento de PAYMENT_OVERDUE
  - ✅ Implementado em `asaas-webhook/index.ts`
  - ✅ Atualiza status para 'overdue'
  - ✅ Cria notificação para usuário
  - ✅ Loga evento processado
  - ⚠️ **PENDENTE:** Testar com webhook real do Asaas
  - _Requirements: 4.4_

- [~] 14. Implementar processamento de eventos de split
  - ✅ Implementado em `asaas-webhook/index.ts`
  - ✅ Atualiza status em asaas_splits
  - ✅ Registra comissão em affiliate_commissions
  - ✅ Loga evento processado
  - ⚠️ **PENDENTE:** Testar com webhook real de split
  - _Requirements: 4.6, 5.6_

- [~] 15. Implementar retry de webhooks falhados
  - ✅ Arquivo criado: `supabase/functions/retry-failed-webhooks/index.ts`
  - ✅ Função para reprocessar webhooks com erro
  - ✅ Backoff exponencial implementado
  - ✅ Limite de 5 tentativas
  - ✅ Registra em webhook_errors após falhas
  - ⚠️ **PENDENTE:** Testar retry com webhook falhado
  - _Requirements: 4.7, 10.6_

## Fase 4: Refatoração do Frontend

- [~] 16. Refatorar hook useFiliacaoPayment
  - ✅ Arquivo: `src/hooks/useFiliacaoPayment.ts`
  - ✅ Removida chamada para asaas-configure-split (obsoleta)
  - ✅ Passa affiliateInfo para asaas-create-subscription
  - ✅ Aguarda confirmação de split na resposta
  - ✅ Salva initial_payment_id em user_subscriptions
  - ✅ Tratamento de erros melhorado
  - ⚠️ **PENDENTE:** Testar fluxo completo de filiação
  - _Requirements: 8.1, 8.2, 8.3, 8.7_

- [~] 17. Implementar validação de afiliado no frontend
  - ✅ Hook `useReferralCode` implementado
  - ✅ Captura automática de código da URL (?ref=CODIGO)
  - ✅ Validação silenciosa (sem alertas visuais)
  - ✅ Salva no localStorage para persistir
  - ✅ Integrado em `Filiacao.tsx`
  - ✅ Removido campo manual de código (discreto)
  - ⚠️ **PENDENTE:** Testar com link de afiliado real
  - _Requirements: 5.1, 5.2, 6.6_

- [~] 18. Melhorar tratamento de erros
  - ✅ Arquivo criado: `src/utils/errorMessages.ts`
  - ✅ Mapeamento completo de erros do Asaas
  - ✅ Mensagens amigáveis por tipo de erro
  - ✅ Hook `useRetry` com backoff exponencial
  - ✅ Componente `ErrorAlert` para exibição
  - ✅ Integrado em `useFiliacaoPayment`
  - ⚠️ **PENDENTE:** Testar com erros reais (cartão recusado, CPF duplicado)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 19. Remover validação restritiva de PIX
  - ❌ **TAREFA CANCELADA** - Decisão: manter apenas Cartão de Crédito
  - ✅ Validação mantida: apenas CREDIT_CARD para filiações
  - ✅ PIX disponível para outros serviços (certidões, regularizações)
  - _Requirements: N/A - Requisito não será implementado_

## Fase 5: Migração de Dados e Limpeza

- [x] 20. Migrar dados de asaas_subscriptions para user_subscriptions

  - ✅ Análise realizada: ambas tabelas vazias (0 registros)
  - ✅ Nenhum dado para migrar
  - ✅ Função de migração criada para uso futuro (se necessário)
  - _Requirements: 2.5_

- [ ] ~~21. Marcar asaas_subscriptions como deprecated~~
  - ❌ **CANCELADA** - Será tratada na Fase 6 (Limpeza)

- [ ] ~~22. Configurar webhooks no Asaas~~
  - ❌ **CANCELADA** - Requer acesso manual (não é tarefa de código)

- [ ] ~~23. Criar dashboard de monitoramento~~
  - ❌ **CANCELADA** - Será tratada após validação do sistema

## Fase 6: Limpeza e Consolidação do Sistema

- [x] 21. Analisar e consolidar tabelas de serviços



  - Identificar tabelas duplicadas: servico_assinantes, servicos, servicos_regularizacao, solicitacoes_servicos
  - Verificar qual tabela está realmente em uso no código
  - Mapear referências no frontend e backend
  - Documentar propósito de cada tabela
  - _Requirements: Limpeza técnica_

- [x] 22. Deprecar/remover tabelas não utilizadas




  - Marcar tabelas obsoletas como DEPRECATED
  - Criar migração para remover tabelas não utilizadas
  - Atualizar tipos TypeScript
  - Remover referências no código
  - _Requirements: Limpeza técnica_

- [ ] 23. Limpar diretório de migrações




  - Identificar migrações com erro que não foram aplicadas
  - Remover arquivos de migração duplicados ou obsoletos
  - Documentar migrações que devem ser mantidas
  - Criar backup antes de remover
  - _Requirements: Organização_

- [x] 24. Limpar arquivos temporários e de análise

  - Remover scripts Python de análise temporários
  - Remover arquivos .md de documentação duplicada
  - Limpar arquivos de teste não utilizados
  - Manter apenas documentação essencial
  - _Requirements: Organização_

- [x] 25. Consolidar documentação



  - Criar documento único de arquitetura do sistema
  - Documentar estrutura final de tabelas
  - Documentar fluxos principais (filiação, pagamento, webhook)
  - Remover documentos redundantes
  - _Requirements: Documentação_

## Fase 7: Testes e Validação

- [x] 26. Testar fluxo completo de filiação sem afiliado




  - Criar novo usuário
  - Verificar cobrança imediata criada
  - Verificar assinatura criada com nextDueDate correto
  - Verificar split configurado (50% RENUM + 50% COMADEMIG)
  - Simular webhook de pagamento
  - Verificar status atualizado para 'active'
  - _Requirements: 3.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 27. Testar fluxo completo de filiação com afiliado
  - Criar novo usuário com código de referral
  - Verificar afiliado validado e exibido
  - Verificar split configurado (40% RENUM + 40% COMADEMIG + 20% Afiliado)
  - Simular webhook de pagamento
  - Verificar comissão registrada em affiliate_commissions
  - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 28. Testar todos os métodos de pagamento
  - Testar PIX em plano mensal
  - Testar PIX em plano semestral
  - Testar PIX em plano anual
  - Testar cartão em todos os planos
  - Verificar desconto de 5% aplicado no PIX
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 29. Testar tratamento de erros
  - Testar CPF duplicado
  - Testar email duplicado
  - Testar cartão inválido
  - Testar código de afiliado inválido
  - Verificar mensagens de erro específicas
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [ ] 30. Testar webhooks
  - Enviar webhook de teste para cada tipo de evento
  - Verificar processamento correto
  - Testar idempotência (enviar mesmo evento 2x)
  - Testar retry em caso de falha
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ] 31. Testar segurança
  - Tentar acessar dados de outro usuário (deve falhar)
  - Tentar modificar asaas_customers como usuário comum (deve falhar)
  - Verificar que admin vê todos os dados
  - Verificar que super_admin não pode ser deletado
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 32. Validação final e documentação
  - Revisar todos os requisitos atendidos
  - Atualizar documentação técnica
  - Criar guia de troubleshooting
  - Documentar configurações necessárias
  - Preparar plano de rollback
  - _Requirements: Todos_


---

## 🔒 CHECKLIST DE VALIDAÇÃO OBRIGATÓRIA

### Antes de marcar qualquer tarefa como [x], verificar:

#### Para Migrações de Banco (Tarefas 1-5):
- [ ] Migração aplicada no banco via `supabase db push`
- [ ] Estrutura verificada via `supabase db execute "SELECT ..."`
- [ ] Dados de teste inseridos com sucesso
- [ ] Políticas RLS testadas com diferentes roles
- [ ] Nenhum erro no console do Supabase

#### Para Edge Functions (Tarefas 6-15):
- [ ] Function deployada via `supabase functions deploy nome`
- [ ] Logs verificados via `supabase functions logs nome`
- [ ] Testada com dados reais via Postman/cURL
- [ ] Resposta correta recebida
- [ ] Dados persistidos no banco

#### Para Frontend (Tarefas 16-18):
- [ ] Código compilando sem erros
- [ ] Página acessível no navegador
- [ ] Formulário renderizando corretamente
- [ ] Interações funcionando (cliques, inputs)
- [ ] Dados sendo enviados corretamente
- [ ] Feedback visual adequado (loading, success, error)

#### Para Fluxo Completo (Tarefas 24-25):
- [ ] Novo usuário criado com sucesso
- [ ] Pagamento processado
- [ ] Assinatura criada no Asaas
- [ ] Splits configurados
- [ ] Dados salvos no banco
- [ ] Usuário ativado
- [ ] Webhook recebido e processado

---

## 📋 RELATÓRIO DE IMPLEMENTAÇÃO

### ✅ Arquivos Criados/Modificados:

#### Migrações SQL:
1. `supabase/migrations/20251014000001_fix_triggers_and_foreign_keys.sql`
2. `supabase/migrations/20251016042413_update_user_subscriptions_fields.sql`
3. `supabase/migrations/20251016044919_update_webhook_events_structure.sql`
4. `supabase/migrations/20251016045536_update_asaas_splits_structure.sql`
5. `supabase/migrations/20251016050646_fix_rls_policies_security.sql`

#### Edge Functions:
1. `supabase/functions/asaas-create-subscription/index.ts` (refatorado)
2. `supabase/functions/asaas-webhook/index.ts` (novo)
3. `supabase/functions/retry-failed-webhooks/index.ts` (novo)
4. `supabase/functions/shared/split-config.ts` (novo)
5. `supabase/functions/shared/logger.ts` (novo)

#### Frontend - Hooks:
1. `src/hooks/useFiliacaoPayment.ts` (refatorado)
2. `src/hooks/useReferralCode.ts` (atualizado)
3. `src/hooks/useRetry.ts` (novo)

#### Frontend - Componentes:
1. `src/components/payments/PaymentFormEnhanced.tsx` (refatorado)
2. `src/components/ui/error-alert.tsx` (novo)
3. `src/pages/Filiacao.tsx` (refatorado)

#### Frontend - Utilitários:
1. `src/utils/errorMessages.ts` (novo)

### ❌ Arquivos Removidos (Limpeza):
1. `src/components/payments/AffiliateCodeInput.tsx` (não usado)
2. `src/hooks/useAffiliateValidation.ts` (não usado)
3. `supabase/functions/validate-affiliate-code/index.ts` (não usado)

---

## ⚠️ AÇÕES NECESSÁRIAS PARA VALIDAÇÃO

### 1. Aplicar Migrações no Banco
```powershell
supabase db push
```

### 2. Deploy de Edge Functions
```powershell
supabase functions deploy asaas-create-subscription
supabase functions deploy asaas-webhook
supabase functions deploy retry-failed-webhooks
```

### 3. Configurar Variáveis de Ambiente
```powershell
supabase secrets set RENUM_WALLET_ID=valor
supabase secrets set COMADEMIG_WALLET_ID=valor
```

### 4. Testar Fluxo de Filiação
- Acessar: http://localhost:8080/filiacao
- Preencher formulário completo
- Processar pagamento com cartão de teste
- Verificar criação de assinatura
- Verificar splits configurados

### 5. Configurar Webhooks no Asaas
- Dashboard Asaas > Webhooks
- URL: https://[seu-projeto].supabase.co/functions/v1/asaas-webhook
- Token: [configurar secret]
- Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, etc

---

## 🎯 CRITÉRIO PARA MARCAR [x]

**Uma tarefa SÓ será marcada como [x] quando:**
1. ✅ Código implementado
2. ✅ Migração aplicada (se aplicável)
3. ✅ Function deployada (se aplicável)
4. ✅ Testada manualmente com sucesso
5. ✅ Resultado documentado
6. ✅ **Você validou e aprovou**

**Atualmente: 18 tarefas [~] aguardando validação**
