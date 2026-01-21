# Auditoria Técnica: Webhook Asaas vs Boas Práticas

**Data**: 20/01/2026  
**Analista**: Antigravity (IA)  
**Escopo**: Supabase Edge Functions e Banco de Dados  

## 📊 Matriz de Aderência técnica

| Requisito Boas Práticas | Status | Observação Técnica |
| :--- | :---: | :--- |
| **Segurança (Auth Token)** | ✅ | Uso de `asaas-access-token` via header. |
| **Segurança (HTTPS)** | ✅ | Infraestrutura Supabase nativa com HTTPS. |
| **Performance (ACK 200)** | ⚠️ | O processamento é síncrono. Se o banco demorar, o Asaas pode dar timeout. |
| **Idempotência** | ✅ | Implementada via `asaas_event_id` na tabela `webhook_events`. |
| **Resiliência (Retries)** | ✅ | Função `retry-failed-webhooks` implementa Backoff Exponencial. |
| **Observabilidade (Logs)** | ✅ | Sistema centralizado em `system_logs` com sanitização de dados. |
| **Segurança de Rede (JWT)** | ❌ | **Causa do Erro 401**: Verificação de JWT ativa bloqueia gateway externo. |

---

## 🔍 Análise Detalhada

### 1. Duplicidade Funcional (Inconsistência)
Notei que existem duas funções para a mesma finalidade:
- `asaas-process-webhook`: Função herdada/antiga com processamento direto.
- `asaas-webhook`: Função moderna, com sistema de logs estruturado e verificação de idempotência.

> [!IMPORTANT]
> O erro 401 relatado (Unauthorized) está ocorrendo na `asaas-process-webhook`, que parece ser a rota configurada no painel do Asaas, mas ela carece de algumas proteções de idempotência presentes na nova versão.

### 2. Idempotência e Concorrência
A implementação na função `asaas-webhook` é excelente:
- Ela gera um `eventId` único combinando o tipo de evento e o ID do pagamento.
- Verifica se o evento já existe na tabela `webhook_events` antes de processar. Isso evita cobranças duplicadas ou splits repetidos caso o Asaas reenvie o mesmo webhook.

### 3. Processamento Síncrono vs Assíncrono
O Asaas recomenda retornar um HTTP 200 o mais rápido possível.
- **Implementação Atual**: Síncrona. A função só responde após atualizar o banco e executar ações pós-pagamento.
- **Risco**: Se a execução demorar mais de 3-5 segundos (comum em picos de carga ou lentidão no banco), o Asaas marcará como falha e tentará novamente, o que pode sobrecarregar o sistema.

### 4. Resiliência
A existência da função `retry-failed-webhooks` é uma **melhor prática de nível Sênior**. O uso de Backoff Exponencial (1min, 5min, 15min, 1h, 6h) garante que interrupções temporárias do banco não resultem em perda definitiva de dados.

---

## 🎯 Recomendações Técnicas

1.  **Unificação de Endpoints**: Recomendo migrar a URL no painel do Asaas para apontar exclusivamente para `asaas-webhook`, desativando a `asaas-process-webhook` após validar que todos os fluxos (splits, serviços) estão cobertos na nova.
2.  **Correção de Rede (Urgente)**: Aplicar o deploy com `--no-verify-jwt` para restaurar o fluxo de comunicação.
3.  **Refatoração para Async**: No futuro, considerar o uso de **Edge HTTP Requests** para responder ACK 200 imediatamente e processar a lógica pesada em background (ex: Supabase Queues ou disparando uma segunda função interna).

## ✅ Conclusão
A implementação atual é robusta e segue a maioria das boas práticas modernas (Idempotência e Retry). O erro atual é puramente de **configuração de infraestrutura (JWT)** e não de lógica de código.

---
**Status da Análise**: ✅ Concluído não validado (Relatório entregue)
