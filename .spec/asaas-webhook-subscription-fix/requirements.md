# Requisitos - Correção de Webhook de Assinaturas Asaas

## Contexto
O webhook do Asaas está enviando eventos relacionados a assinaturas (`SUBSCRIPTION_DELETED`, etc.). A implementação atual falha ao processar esses eventos em alguns casos, resultando em erro 500.

## Objetivos
1. **Resiliência Total**: O webhook deve retornar `200 OK` para o Asaas, independentemente de falhas no processamento interno (que devem ser logadas para correção posterior).
2. **Suporte a Assinaturas**: Corrigir a extração de IDs e a lógica de processamento para eventos que contém apenas o objeto `subscription`.
3. **Log de Auditoria**: Garantir que o registro inicial do webhook no banco (`logWebhook`) seja robusto e não cause falhas na resposta.
4. **Tratamento de Erros**: Capturar erros síncronos e assíncronos de forma a não interromper o fluxo de recepção.

## Critérios de Aceite
- [ ] Receber `SUBSCRIPTION_DELETED` e retornar `200 OK`.
- [ ] O banco de dados deve registrar o webhook mesmo que a cobrança/assinatura não exista localmente.
- [ ] O processamento assíncrono deve tentar atualizar o status da assinatura se ela existir no banco `user_subscriptions`.
- [ ] Nenhuma exceção não tratada deve causar erro 500 após a validação inicial do token e do payload.
