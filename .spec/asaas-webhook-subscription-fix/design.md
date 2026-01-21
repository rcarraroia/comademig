# Design - Correção de Webhook de Assinaturas Asaas

## Arquitetura da Solução

### 1. Refatoração da Recepção (index.ts)
A estrutura principal do handler será ajustada para garantir que a resposta `200 OK` seja enviada antes de qualquer processamento complexo que possa falhar.

- **Validação**: Manter validação de token e estrutura básica de JSON.
- **Identificação**: Melhorar a extração do `entityId` para ser resiliente a payloads variados.
- **Log Infalível**: Envolver a chamada de `logWebhook` em um bloco que garanta o retorno de um ID (mesmo que mockado ou vazio) sem lançar exceções.

### 2. Normalização de Entidades em processSubscriptionEvent
O processador de assinaturas atual espera um `AsaasPayment` mas recebe um `AsaasSubscription`.
- **Nova Lógica**: O processador receberá um objeto genérico ou detectará o tipo para extrair o ID correto da assinatura.
- **Queries Seguras**: Utilizar `.maybeSingle()` em todas as buscas de banco (já em andamento, mas reforçar).
- **Fallback de Usuário**: Se a cobrança/assinatura não for encontrada no banco local, logar um aviso e encerrar o processamento graciosamente (sem erro).

### 3. Melhoria na Estrutura de Logs
- Utilizar `console.group` ou prefixos claros para diferenciar logs de recebimento (sinc) de processamento (async).
- Manter o registro detalhado de erros na tabela `asaas_webhooks`.

## Alterações de Código

- **Supabase Edge Function**: `asaas-process-webhook/index.ts`
  - Ajustar `logWebhook` para evitar qualquer possibilidade de erro síncrono.
  - Ajustar o handler principal para capturar erros específicos de `req.json()`.
  - Ajustar `processSubscriptionEvent` para lidar com a diferença entre `payment.subscription` e `subscription.id`.
