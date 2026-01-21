# Tarefas - Correção de Webhook de Assinaturas Asaas

- [x] Aprovação do Plano pelo Usuário <!-- id: 0 -->

## Fase 1: Auditoria e Reforço de Segurança
- [x] Revisar `logWebhook` para garantir que `insert` e `select().single()` não lancem exceções não tratadas <!-- id: 1 -->
- [x] Verificar se `WEBHOOK_TOKEN` está sendo carregado corretamente <!-- id: 2 -->

## Fase 2: Implementação da Flexibilidade de Entidades
- [x] Ajustar `processSubscriptionEvent` para extrair o ID da assinatura corretamente de qualquer objeto (payment ou subscription) <!-- id: 3 -->
- [x] Corrigir o switch/case de eventos de assinatura para usar o ID extraído de forma consistente <!-- id: 4 -->
- [x] Adicionar logs de depuração síncronos logo após o parse do JSON para identificar exatamente o que chega do Asaas <!-- id: 5 -->

## Fase 3: Resiliência de Erros
- [x] Envolver o parse JSON e validação inicial em um bloco `try-catch` específico que retorne 400 em vez de 500 se possível <!-- id: 6 -->
- [x] Garantir que o retorno 500 final seja apenas para erros críticos de infraestrutura ou bugs fatais no código de roteamento <!-- id: 7 -->

## Fase 4: Validação e deploy
- [x] Realizar deploy da versão corrigida <!-- id: 8 -->
- [x] Simular payload de `SUBSCRIPTION_DELETED` via curl <!-- id: 9 -->
- [x] Validar no log se o processamento terminou com "Cobrança não encontrada" (esperado se testar com IDs fakes) mas retornou 200 OK <!-- id: 10 -->
- [x] Remover logs excessivos e `stack` trace do retorno 500 <!-- id: 11 -->
