# Configuração Asaas - Chave de API e Webhook

**Data:** 26/08/2025  
**Sistema:** COMADEMIG  
**Versão:** 1.0

## 1. Confirmação da Chave de API Principal

### ✅ **Configuração Atual**

**Variável de Ambiente:** `ASAAS_API_KEY`

**Localização da Configuração:**
- Todas as Edge Functions utilizam a mesma variável de ambiente
- Configurada no painel do Supabase (Project Settings → Edge Functions → Environment Variables)

**Funções que Utilizam a Chave:**
1. `asaas-create-payment` - Criação de cobranças simples
2. `asaas-create-payment-with-split` - Criação de cobranças com split de afiliados
3. `asaas-check-payment` - Verificação de status de pagamentos

### 🔐 **Segurança da Chave**

- ✅ Armazenada como variável de ambiente segura
- ✅ Não exposta no código frontend
- ✅ Acessível apenas pelas Edge Functions autenticadas
- ✅ Validação de existência antes de cada uso

### 🚨 **AÇÃO CRÍTICA DE SEGURANÇA**

**URGENTE:** A chave de API foi exposta publicamente e deve ser revogada IMEDIATAMENTE.

**Procedimento de Segurança:**
1. **REVOGAR** a chave atual no painel Asaas (Configurações → Integrações → API)
2. **GERAR** uma nova chave de produção
3. **ATUALIZAR** no Supabase: Project Settings → Edge Functions → Environment Variables
4. Nome da variável: `ASAAS_API_KEY`
5. Valor: [Nova chave de produção - MANTER SEGURA]

**Status da Chave Fornecida:**
- ✅ Formato válido (chave de produção Asaas)
- ❌ COMPROMETIDA (exposta publicamente)
- 🔄 DEVE SER SUBSTITUÍDA

## 2. Configuração do Webhook

### 🌐 **URL do Webhook**

**URL Completa:**
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Componentes da URL:**
- **Base URL:** `https://amkelczfwazutrciqtlk.supabase.co`
- **Endpoint:** `/functions/v1/asaas-webhook`
- **Método:** `POST`
- **Autenticação:** Não requer JWT (configurado como `verify_jwt = false`)

### 📋 **Eventos para Configurar no Painel Asaas**

**Eventos Obrigatórios:**
```
✅ PAYMENT_CONFIRMED
✅ PAYMENT_RECEIVED  
✅ PAYMENT_CREDITED
```

**Eventos Opcionais (Recomendados):**
```
⚪ PAYMENT_OVERDUE
⚪ PAYMENT_DELETED
⚪ PAYMENT_RESTORED
⚪ PAYMENT_REFUNDED
```

### 🔧 **Configuração no Painel Asaas**

**Passo a Passo:**

1. **Acesse o Painel Asaas:**
   - Login na conta da COMADEMIG
   - Vá para: Configurações → Integrações → Webhooks

2. **Criar Novo Webhook:**
   - Clique em "Novo Webhook"
   - Nome: `COMADEMIG Sistema Principal`
   - URL: `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook`
   - Método: `POST`

3. **Selecionar Eventos:**
   - ✅ Marcar: `PAYMENT_CONFIRMED`
   - ✅ Marcar: `PAYMENT_RECEIVED`
   - ✅ Marcar: `PAYMENT_CREDITED`
   - ⚪ Opcional: `PAYMENT_OVERDUE`
   - ⚪ Opcional: `PAYMENT_DELETED`
   - ⚪ Opcional: `PAYMENT_RESTORED`
   - ⚪ Opcional: `PAYMENT_REFUNDED`

4. **Configurações Adicionais:**
   - Status: `Ativo`
   - Versão da API: `v3` (mais recente)
   - Timeout: `30 segundos`
   - Tentativas: `3`

5. **Salvar Configuração**

### 🔍 **Estrutura do Payload Esperado**

O webhook está configurado para processar payloads no seguinte formato:

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456789",
    "value": 250.00,
    "status": "CONFIRMED",
    "externalReference": "referral:uuid-do-afiliado",
    "customer": "cus_123456789",
    "dueDate": "2024-01-15",
    "description": "Taxa de Filiação - COMADEMIG"
  }
}
```

### 🛡️ **Segurança do Webhook**

**Recursos de Segurança Implementados:**

1. **Idempotência:**
   - Cada evento é processado apenas uma vez
   - Verificação por `event_id` único
   - Armazenamento em `webhook_events` para auditoria

2. **Validação de Dados:**
   - Verificação de estrutura do payload
   - Validação de IDs de pagamento
   - Tratamento de erros robusto

3. **Auditoria Completa:**
   - Todos os eventos são registrados
   - Payload completo armazenado para debug
   - Status de processamento rastreado

4. **CORS Configurado:**
   - Headers apropriados para requisições cross-origin
   - Suporte a métodos OPTIONS

### 📊 **Processamento de Eventos**

**Fluxo de Processamento:**

1. **Recebimento do Webhook:**
   - Validação do payload
   - Verificação de idempotência
   - Registro para auditoria

2. **Processamento de Pagamento:**
   - Identificação do tipo de cobrança
   - Processamento de split (se houver afiliado)
   - Atualização de status no banco

3. **Ações Específicas:**
   - `filiacao`: Ativar perfil do usuário
   - `taxa_anual`: Atualizar status financeiro
   - `certidao`: Aprovar solicitação

4. **Finalização:**
   - Marcar evento como processado
   - Retornar confirmação para Asaas

### 🧪 **Teste do Webhook**

**Para Testar a Configuração:**

1. **Teste Manual:**
   ```bash
   curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook \
   -H "Content-Type: application/json" \
   -d '{
     "event": "PAYMENT_CONFIRMED",
     "payment": {
       "id": "test_123",
       "value": 250.00,
       "status": "CONFIRMED"
     }
   }'
   ```

2. **Verificar Logs:**
   - Supabase Dashboard → Edge Functions → asaas-webhook → Logs
   - Verificar se o evento foi processado corretamente

3. **Verificar Banco:**
   - Tabela `webhook_events` deve conter o evento
   - Status `processed` deve ser `true`

### 📋 **Checklist de Configuração**

**Antes de Ativar em Produção:**

- [ ] Chave `ASAAS_API_KEY` configurada corretamente no Supabase
- [ ] Webhook URL configurada no painel Asaas
- [ ] Eventos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_CREDITED` marcados
- [ ] Webhook testado com payload de exemplo
- [ ] Logs verificados no Supabase
- [ ] Banco de dados verificado para eventos processados

### 🚨 **Monitoramento**

**Métricas para Acompanhar:**

1. **Taxa de Sucesso do Webhook:**
   - Eventos recebidos vs processados
   - Tempo de resposta médio

2. **Erros Comuns:**
   - Timeouts de conexão
   - Payloads malformados
   - Falhas de processamento

3. **Auditoria:**
   - Verificação diária da tabela `webhook_events`
   - Eventos não processados (`processed = false`)

### 📞 **Suporte Técnico**

**Em Caso de Problemas:**

1. **Verificar Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Procurar por erros ou timeouts

2. **Verificar Conectividade:**
   - Testar URL do webhook manualmente
   - Verificar se Asaas consegue alcançar o endpoint

3. **Contato:**
   - Suporte Asaas: Para problemas de entrega de webhook
   - Suporte Supabase: Para problemas de Edge Functions

---

## 📋 **Resumo das Informações Solicitadas**

### 1. **Chave de API Principal:**
- **Variável:** `ASAAS_API_KEY`
- **Localização:** Supabase Environment Variables
- **Status:** ⚠️ Confirmar se corresponde à conta COMADEMIG

### 2. **URL do Webhook:**
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

### 3. **Eventos para Marcar:**
- ✅ `PAYMENT_CONFIRMED`
- ✅ `PAYMENT_RECEIVED`
- ✅ `PAYMENT_CREDITED`

**Status:** ✅ Sistema pronto para receber webhooks  
**Próximo Passo:** Configurar no painel Asaas conforme instruções acima

---

**Documento preparado por:** Kiro AI  
**Data:** 26/08/2025  
**Próxima Revisão:** Após configuração no painel Asaas