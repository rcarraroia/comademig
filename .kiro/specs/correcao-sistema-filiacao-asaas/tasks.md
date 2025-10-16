# Implementation Plan - Correção Sistema de Filiação e Integração Asaas

## Fase 1: Correções Críticas e Preparação do Banco

- [x] 1. Corrigir trigger sync_user_role_to_metadata
  - ✅ Trigger removido (causava deadlock)
  - ✅ Trigger handle_new_user corrigido com tratamento de erro
  - ✅ Foreign key profiles_id_fkey tornada DEFERRABLE
  - ✅ Trigger audit_profiles corrigido para não bloquear DELETE
  - ✅ Cadastro funcionando 100%
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Criar tabela webhook_events
  - Criar migração SQL com estrutura completa
  - Adicionar índices para performance
  - Criar RLS policies (apenas service_role)
  - _Requirements: 4.1, 4.7_

- [ ] 3. Atualizar tabela user_subscriptions
  - Adicionar campos: initial_payment_id, asaas_customer_id, billing_type, cycle, value
  - Adicionar constraint para status
  - Criar índices necessários
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 4. Atualizar tabela asaas_splits
  - Adicionar campos: subscription_id, payment_id, status, refusal_reason
  - Atualizar constraints e foreign keys
  - Criar índices para queries frequentes
  - _Requirements: 3.1, 3.6_

- [ ] 5. Corrigir RLS policies
  - Atualizar policy de asaas_customers (remover authenticated)
  - Criar policies restritivas para user_subscriptions
  - Criar policies para asaas_splits
  - Testar com diferentes roles (user, admin, service_role)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Fase 2: Implementação do Sistema de Split

- [ ] 6. Criar função getSplitConfiguration
  - Buscar wallet_id da RENUM (variável de ambiente)
  - Buscar wallet_id do afiliado (se código fornecido)
  - Calcular percentuais corretos (com/sem afiliado)
  - Retornar array de splits formatado para Asaas
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Refatorar Edge Function asaas-create-subscription
  - Adicionar parâmetro affiliateCode na interface
  - Chamar getSplitConfiguration antes de criar subscription
  - Criar cobrança imediata (initial payment) com split
  - Criar assinatura com split e nextDueDate = hoje + 30 dias
  - Salvar dados em user_subscriptions (não mais em asaas_subscriptions)
  - Registrar splits em asaas_splits
  - Retornar IDs de subscription e initial payment
  - _Requirements: 3.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.7_

- [ ] 8. Adicionar validação de código de afiliado
  - Criar função para validar se código existe
  - Buscar dados do afiliado (nome, foto, wallet_id)
  - Retornar erro específico se código inválido
  - _Requirements: 5.1, 5.2, 6.6_

- [ ] 9. Adicionar logs estruturados
  - Logar criação de subscription com todos os parâmetros
  - Logar configuração de split (walletIds, percentuais)
  - Logar erros com stack trace completo
  - _Requirements: 10.1, 10.3, 10.4_

## Fase 3: Implementação de Webhooks

- [ ] 10. Criar Edge Function asaas-webhook
  - Criar estrutura básica da função
  - Implementar validação de autenticidade (asaas-access-token)
  - Implementar verificação de idempotência (asaas_event_id)
  - Salvar evento em webhook_events
  - _Requirements: 4.1, 4.7_

- [ ] 11. Implementar processamento de PAYMENT_RECEIVED
  - Buscar subscription pelo asaas_subscription_id
  - Atualizar status de 'pending' para 'active'
  - Atualizar started_at se for primeiro pagamento
  - Logar evento processado
  - _Requirements: 4.2, 8.5_

- [ ] 12. Implementar processamento de PAYMENT_CONFIRMED
  - Registrar confirmação do pagamento
  - Atualizar dados financeiros se necessário
  - Logar evento processado
  - _Requirements: 4.3_

- [ ] 13. Implementar processamento de PAYMENT_OVERDUE
  - Atualizar status para 'overdue'
  - Criar notificação para usuário
  - Logar evento processado
  - _Requirements: 4.4_

- [ ] 14. Implementar processamento de eventos de split
  - Atualizar status em asaas_splits
  - Registrar comissão em affiliate_commissions
  - Logar evento processado
  - _Requirements: 4.6, 5.6_

- [ ] 15. Implementar retry de webhooks falhados
  - Criar função para reprocessar webhooks com erro
  - Implementar backoff exponencial
  - Limitar número de tentativas (máximo 5)
  - Registrar em webhook_errors após falhas
  - _Requirements: 4.7, 10.6_

## Fase 4: Refatoração do Frontend

- [ ] 16. Refatorar hook useFiliacaoPayment
  - Remover chamada para asaas-configure-split (obsoleta)
  - Passar affiliateCode para asaas-create-subscription
  - Aguardar confirmação de split na resposta
  - Salvar initial_payment_id em user_subscriptions
  - _Requirements: 8.1, 8.2, 8.3, 8.7_

- [ ] 17. Implementar validação de afiliado no frontend
  - Adicionar função loadAffiliateInfo
  - Validar código quando usuário digita
  - Exibir informações do afiliado (nome, foto)
  - Mostrar erro se código inválido
  - _Requirements: 5.1, 5.2, 6.6_

- [ ] 18. Melhorar tratamento de erros
  - Mapear erros do Asaas para mensagens amigáveis
  - Exibir mensagens específicas por tipo de erro
  - Adicionar retry automático para erros temporários
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 19. Remover validação restritiva de PIX
  - Remover validação no backend que rejeita PIX para planos mensais/semestrais
  - Garantir que PIX funciona para todos os planos
  - Aplicar desconto de 5% para PIX
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

## Fase 5: Migração de Dados e Limpeza

- [ ] 20. Migrar dados de asaas_subscriptions para user_subscriptions
  - Criar script de migração
  - Validar integridade dos dados migrados
  - Verificar que nenhum dado foi perdido
  - _Requirements: 2.5_

- [ ] 21. Marcar asaas_subscriptions como deprecated
  - Adicionar comentário na tabela
  - Atualizar documentação
  - Remover referências no código
  - _Requirements: 2.3_

- [ ] 22. Configurar webhooks no Asaas
  - Acessar dashboard do Asaas
  - Configurar URL do webhook
  - Configurar token de autenticação
  - Selecionar eventos necessários
  - Testar envio de webhook
  - _Requirements: 4.1_

- [ ] 23. Criar dashboard de monitoramento
  - Exibir taxa de sucesso de cadastros
  - Exibir taxa de sucesso de webhooks
  - Exibir erros recentes
  - Exibir splits pendentes
  - _Requirements: 10.5_

## Fase 6: Testes e Validação

- [ ] 24. Testar fluxo completo de filiação sem afiliado
  - Criar novo usuário
  - Verificar cobrança imediata criada
  - Verificar assinatura criada com nextDueDate correto
  - Verificar split configurado (50% RENUM + 50% COMADEMIG)
  - Simular webhook de pagamento
  - Verificar status atualizado para 'active'
  - _Requirements: 3.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 25. Testar fluxo completo de filiação com afiliado
  - Criar novo usuário com código de referral
  - Verificar afiliado validado e exibido
  - Verificar split configurado (40% RENUM + 40% COMADEMIG + 20% Afiliado)
  - Simular webhook de pagamento
  - Verificar comissão registrada em affiliate_commissions
  - _Requirements: 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 26. Testar todos os métodos de pagamento
  - Testar PIX em plano mensal
  - Testar PIX em plano semestral
  - Testar PIX em plano anual
  - Testar cartão em todos os planos
  - Verificar desconto de 5% aplicado no PIX
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 27. Testar tratamento de erros
  - Testar CPF duplicado
  - Testar email duplicado
  - Testar cartão inválido
  - Testar código de afiliado inválido
  - Verificar mensagens de erro específicas
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [ ] 28. Testar webhooks
  - Enviar webhook de teste para cada tipo de evento
  - Verificar processamento correto
  - Testar idempotência (enviar mesmo evento 2x)
  - Testar retry em caso de falha
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ] 29. Testar segurança
  - Tentar acessar dados de outro usuário (deve falhar)
  - Tentar modificar asaas_customers como usuário comum (deve falhar)
  - Verificar que admin vê todos os dados
  - Verificar que super_admin não pode ser deletado
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 30. Validação final e documentação
  - Revisar todos os requisitos atendidos
  - Atualizar documentação técnica
  - Criar guia de troubleshooting
  - Documentar configurações necessárias
  - Preparar plano de rollback
  - _Requirements: Todos_
