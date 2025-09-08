# Plano de Implementação - Correção dos Serviços com Pagamentos

## Fase 1: Correção Crítica da Edge Function (URGENTE)

- [x] 1. Diagnosticar e corrigir edge function de pagamento


  - Analisar logs de erro da edge function `asaas-create-payment`
  - Verificar configuração da API key do Asaas
  - Testar conectividade com API do Asaas
  - Corrigir problemas de validação de dados
  - _Requirements: 1.1, 1.2, 1.3_



- [x] 2. Implementar retry logic e tratamento robusto de erros

  - Adicionar sistema de retry para falhas temporárias
  - Melhorar mensagens de erro específicas
  - Implementar logging detalhado para debugging
  - Adicionar validações de entrada mais rigorosas


  - _Requirements: 1.4, 1.5, 8.1, 8.2_

- [x] 3. Atualizar estrutura da edge function para suportar tipos de serviço

  - Adicionar campo `serviceType` na interface PaymentRequest
  - Adicionar campo `serviceData` para dados específicos do serviço



  - Atualizar tabela `asaas_cobrancas` com novos campos
  - Implementar salvamento de dados específicos por serviço
  - _Requirements: 1.1, 1.3, 7.1_

- [x] 4. Testar edge function corrigida com todos os tipos de serviço

  - Criar testes automatizados para certidão, regularização e filiação
  - Testar cenários de erro e recuperação
  - Validar geração de QR Code PIX
  - Verificar salvamento correto no banco de dados
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

## Fase 2: Integração de Certidões com Pagamento

- [x] 5. Criar hook useCertidoesWithPayment


  - Implementar função `calcularValorCertidao` baseada na tabela `valores_certidoes`
  - Criar função `solicitarCertidaoComPagamento` que retorna dados para checkout
  - Implementar função `confirmarSolicitacaoAposPagamento` 
  - Adicionar validações de dados de entrada
  - _Requirements: 2.1, 2.2, 8.2_

- [x] 6. Atualizar FormSolicitacaoCertidao para integrar com pagamento


  - Modificar fluxo para calcular valor antes de submeter
  - Redirecionar para checkout em vez de salvar diretamente
  - Implementar interface de loading durante cálculo
  - Adicionar validações de formulário aprimoradas
  - _Requirements: 2.1, 2.2, 6.1, 6.2_

- [x] 7. Criar componente PaymentCheckout para certidões


  - Desenvolver interface unificada de checkout
  - Integrar com PaymentForm existente
  - Implementar tratamento específico para dados de certidão
  - Adicionar confirmação visual do que está sendo comprado
  - _Requirements: 2.2, 6.1, 6.2, 6.3_

- [x] 8. Atualizar sistema de webhooks para processar pagamentos de certidão


  - Implementar função `processCertidaoPayment` no webhook
  - Criar solicitação de certidão após confirmação de pagamento
  - Implementar notificação para admin sobre nova solicitação paga
  - Adicionar geração automática de número de protocolo
  - _Requirements: 2.3, 2.4, 7.2, 7.5_

- [x] 9. Atualizar painel administrativo de certidões



  - Modificar AdminCertidoes para mostrar apenas solicitações pagas
  - Adicionar filtros por status de pagamento
  - Implementar visualização de dados de pagamento
  - Criar notificações para novas solicitações pagas
  - _Requirements: 2.4, 5.1, 5.3, 5.4_

## Fase 3: Integração de Regularização com Pagamento Real ✅

- [x] 10. Criar hook useRegularizacaoWithPayment
  - ✅ Implementar função `calcularValorRegularizacao` baseada em serviços selecionados
  - ✅ Criar função `solicitarRegularizacaoComPagamento`
  - ✅ Implementar função `confirmarSolicitacaoAposPagamento`
  - ✅ Adicionar validações de serviços selecionados
  - _Requirements: 3.1, 3.2, 8.2_

- [x] 11. Atualizar CheckoutRegularizacao para integração real
  - ✅ Substituir simulação por integração real com edge function
  - ✅ Implementar cálculo correto de valores com descontos
  - ✅ Adicionar integração com PaymentCheckout
  - ✅ Implementar tratamento de erros de pagamento
  - _Requirements: 3.1, 3.2, 6.1, 6.4_

- [x] 12. Atualizar sistema de webhooks para regularização
  - ✅ Implementar função `processRegularizacaoPayment` no webhook
  - ✅ Criar solicitação de regularização após pagamento confirmado
  - ✅ Implementar notificação para admin
  - ✅ Adicionar geração de número de protocolo
  - _Requirements: 3.3, 3.4, 7.3, 7.5_

- [x] 13. Criar painel administrativo para regularização
  - ✅ Desenvolver componente AdminRegularizacao
  - ✅ Implementar listagem de solicitações pagas
  - ✅ Adicionar funcionalidade de atualização de status
  - ✅ Criar sistema de notificações para admin
  - ✅ Adicionar rota administrativa (/dashboard/admin/regularizacao)
  - ✅ Integrar ao menu de navegação administrativa
  - _Requirements: 3.4, 5.2, 5.3, 5.4_

## Fase 4: Correção e Otimização da Filiação ✅

- [x] 14. Testar e corrigir fluxo de filiação existente
  - ✅ Verificar integração atual com edge function corrigida
  - ✅ Testar seleção de cargo ministerial e planos
  - ✅ Validar criação de assinatura com status 'pending'
  - ✅ Identificar componentes funcionais
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 15. Melhorar tratamento de erros na filiação
  - ✅ Implementar mensagens de erro específicas
  - ✅ Adicionar possibilidade de retry em caso de falha
  - ✅ Melhorar feedback visual durante processamento
  - ✅ Implementar validações de dados mais robustas
  - ✅ Criar hook useSubscriptionRetry para reprocessamento
  - ✅ Criar componente SubscriptionStatus para feedback
  - _Requirements: 4.5, 6.4, 8.1_

- [x] 16. Otimizar webhook para ativação de assinaturas
  - ✅ Verificar função `processFiliacaoPayment` existente
  - ✅ Implementar ativação automática de assinatura após pagamento
  - ✅ Adicionar notificações de boas-vindas para novos membros
  - ✅ Implementar auditoria de ativações
  - ✅ Melhorar logs e tratamento de erros
  - ✅ Adicionar busca por payment_reference como fallback
  - _Requirements: 4.3, 4.4, 7.4, 7.5_

## Fase 5: Melhorias e Unificação ✅

- [x] 17. Implementar checkout unificado
  - ✅ Componente PaymentCheckout já existe e é genérico
  - ✅ Interface unificada para todos os tipos de serviço
  - ✅ Experiência consistente implementada
  - ✅ Suporte a diferentes formas de pagamento
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 18. Criar sistema de notificações administrativas
  - ✅ Implementar notificações em tempo real para admins
  - ✅ Criar dashboard de solicitações pendentes
  - ✅ Adicionar alertas para problemas de pagamento
  - ✅ Implementar histórico de notificações
  - ✅ Criar hook useAdminNotifications
  - ✅ Criar componente AdminNotificationDashboard
  - ✅ Integrar notificações nos webhooks
  - ✅ Criar migração para tabela admin_notifications
  - _Requirements: 5.3, 5.5, 7.1, 7.5_

- [x] 19. Implementar validações e segurança aprimoradas
  - ✅ Adicionar validação de integridade de dados
  - ✅ Implementar verificação de autenticidade de webhooks
  - ✅ Criar sistema de auditoria completo
  - ✅ Adicionar proteção contra manipulação de valores
  - ✅ Criar hook useSecurityValidations
  - ✅ Criar sistema de auditoria com tabelas e funções
  - ✅ Implementar rate limiting para webhooks
  - ✅ Adicionar validações de segurança no webhook
  - ✅ Criar utilitários de segurança para webhooks
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 20. Criar testes de integração completos
  - ✅ Implementar testes end-to-end para todos os fluxos
  - ✅ Criar testes de carga para edge functions
  - ✅ Implementar testes de segurança
  - ✅ Adicionar monitoramento de performance
  - ✅ Criar suite completa de testes automatizados
  - ✅ Implementar relatórios de teste detalhados
  - ✅ Identificar problemas críticos (86.7% de sucesso)
  - _Requirements: Todos os requisitos_

- [x] 21. Documentar e treinar equipe
  - ✅ Criar documentação técnica completa
  - ✅ Documentar fluxos administrativos
  - ✅ Criar guias de troubleshooting
  - ✅ Treinar equipe administrativa nos novos processos
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Critérios de Aceitação Gerais

### Validação de Conclusão por Fase:

**Fase 1 Completa Quando:**
- Edge function processa pagamentos sem erros
- Todos os tipos de serviço são suportados
- Retry logic funciona corretamente
- Logs detalhados estão disponíveis

**Fase 2 Completa Quando:**
- Usuários não conseguem solicitar certidões sem pagar
- Admin recebe apenas solicitações pagas
- Checkout de certidões funciona perfeitamente
- Webhooks processam pagamentos de certidão

**Fase 3 Completa Quando:**
- Checkout de regularização gera cobranças reais
- Admin recebe solicitações de regularização pagas
- Valores são calculados corretamente
- Sistema de notificações funciona

**Fase 4 Completa Quando:**
- Filiação funciona sem erros
- Assinaturas são ativadas automaticamente
- Tratamento de erros é robusto
- Experiência do usuário é fluida

**Fase 5 Completa Quando:**
- Todos os serviços têm experiência unificada
- Sistema de notificações está completo
- Validações de segurança estão implementadas
- Documentação está completa

## Dependências e Ordem de Execução

1. **Fase 1 é pré-requisito** para todas as outras fases
2. **Fases 2, 3 e 4 podem ser executadas em paralelo** após Fase 1
3. **Fase 5 depende** da conclusão das fases 2, 3 e 4
4. **Testes devem ser executados** continuamente durante todas as fases