# 🔔 CONFIGURAÇÃO DE WEBHOOKS ASAAS

**Data:** 19/10/2025  
**Objetivo:** Processar splits automaticamente quando pagamentos forem confirmados

---

## 📋 SITUAÇÃO ATUAL

### ✅ O que está funcionando:
- Dashboard Financeiro mostrando R$ 29,00
- Splits criados manualmente (2 registros)
- Módulo de Split Management operacional
- Log de Auditoria funcionando

### ⚠️ O que precisa ser configurado:
- **Webhooks do Asaas** para processar splits automaticamente
- Edge Function `asaas-process-splits` precisa ser chamada

---

## 🎯 OBJETIVO DOS WEBHOOKS

Quando um pagamento for confirmado no Asaas:
1. Asaas envia webhook para nossa Edge Function
2. Edge Function processa o split automaticamente
3. Valores são distribuídos conforme configuração
4. Histórico é registrado no sistema

---

## 🔧 CONFIGURAÇÃO NO ASAAS

### Passo 1: Acessar Dashboard do Asaas

1. Login em: https://www.asaas.com
2. Ir em: **Configurações** > **Integrações** > **Webhooks**

### Passo 2: Criar Webhook

**URL do Webhook:**
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-splits
```

**Eventos para Monitorar:**
- ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado
- ✅ `PAYMENT_RECEIVED` - Pagamento recebido
- ✅ `PAYMENT_RECEIVED_IN_CASH` - Pagamento em dinheiro

**Método:** POST

**Headers:**
```
Authorization: Bearer [SUA_SUPABASE_ANON_KEY]
Content-Type: application/json
```

### Passo 3: Configurar Autenticação

No Asaas, adicionar header de autenticação:
```
X-Asaas-Access-Token: [SUA_ASAAS_API_KEY]
```

---

## 📝 EDGE FUNCTION: asaas-process-splits

### Localização:
```
supabase/functions/asaas-process-splits/index.ts
```

### O que ela faz:

1. **Recebe webhook do Asaas** com dados do pagamento
2. **Busca configuração de split** baseada no tipo de serviço
3. **Busca recipients** da configuração
4. **Calcula valores** de cada split
5. **Cria registros** na tabela `asaas_splits`
6. **Registra no log de auditoria**

### Fluxo de Processamento:

```
Pagamento Confirmado no Asaas
         ↓
Webhook enviado para Edge Function
         ↓
Buscar cobrança no banco (asaas_cobrancas)
         ↓
Identificar tipo de serviço (filiacao, servicos, publicidade)
         ↓
Buscar configuração de split ativa
         ↓
Buscar recipients da configuração
         ↓
Calcular valores (percentual × valor total)
         ↓
Criar registros em asaas_splits
         ↓
Registrar em audit_logs
         ↓
Retornar sucesso
```

---

## 🧪 TESTE MANUAL

### Opção 1: Simular Webhook

```bash
curl -X POST \
  https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-process-splits \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_hmkar80b3d1yvpo1",
      "value": 29.00,
      "status": "CONFIRMED"
    }
  }'
```

### Opção 2: Processar Split Manualmente (Python)

Script já criado e testado:
```python
# Ver arquivo: process_split_manual.py
python process_split_manual.py
```

---

## 📊 DADOS DE TESTE CRIADOS

### Splits Processados Manualmente:

| Destinatário | Tipo | Percentual | Valor |
|--------------|------|------------|-------|
| COMADEMIG | comademig | 60% | R$ 17,40 |
| RENUM | renum | 40% | R$ 11,60 |
| **TOTAL** | - | **100%** | **R$ 29,00** |

### Configuração Utilizada:
- **Categoria:** Serviços
- **Descrição:** Certidões, regularização e outros serviços
- **Status:** Ativa

---

## 🔍 VERIFICAÇÃO

### Como verificar se webhooks estão funcionando:

1. **Fazer um pagamento de teste** no Asaas
2. **Aguardar confirmação** do pagamento
3. **Verificar tabela asaas_splits:**
   ```sql
   SELECT * FROM asaas_splits 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```
4. **Verificar logs da Edge Function:**
   ```bash
   supabase functions logs asaas-process-splits
   ```

### Indicadores de Sucesso:
- ✅ Novos registros em `asaas_splits` após pagamento
- ✅ Status = 'done'
- ✅ `processed_at` preenchido
- ✅ Valores corretos calculados

---

## 🚨 TROUBLESHOOTING

### Problema: Splits não são criados automaticamente

**Possíveis causas:**
1. Webhook não configurado no Asaas
2. URL da Edge Function incorreta
3. Autenticação falhando
4. Edge Function com erro

**Solução:**
1. Verificar configuração no Asaas
2. Testar Edge Function manualmente
3. Verificar logs: `supabase functions logs asaas-process-splits`

### Problema: Splits criados com valores errados

**Possíveis causas:**
1. Configuração de percentuais incorreta
2. Tipo de serviço não mapeado corretamente

**Solução:**
1. Verificar `split_configurations` e `split_recipients`
2. Ajustar percentuais se necessário
3. Reprocessar split manualmente

### Problema: Erro "wallet_id não pode ser null"

**Causa:** Recipients sem wallet_id configurado

**Solução:**
1. Atualizar recipients com wallet_ids válidos do Asaas
2. Ou usar placeholders: `wallet_comademig`, `wallet_renum`

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Tabelas Relacionadas:

1. **asaas_cobrancas** - Pagamentos confirmados
2. **split_configurations** - Configurações de split por categoria
3. **split_recipients** - Destinatários e percentuais
4. **asaas_splits** - Splits processados (histórico)
5. **audit_logs** - Log de auditoria

### Campos Importantes:

**asaas_splits:**
- `cobranca_id` - Referência à cobrança
- `recipient_type` - Tipo: comademig, renum, affiliate
- `recipient_name` - Nome do destinatário
- `service_type` - Tipo: filiacao, servicos, publicidade
- `percentage` - Percentual do split
- `commission_amount` - Valor em reais
- `total_value` - Valor total do pagamento
- `wallet_id` - ID da carteira no Asaas
- `status` - Status: pending, done, refused, cancelled
- `processed_at` - Data/hora do processamento

---

## ✅ PRÓXIMOS PASSOS

### Para Apresentação (Terça-feira):
1. ✅ Splits manuais criados (FEITO)
2. ✅ Dashboard mostrando dados (FEITO)
3. ✅ Módulo funcionando (FEITO)
4. ⚠️ Explicar que webhooks serão configurados após aprovação

### Após Aprovação do Cliente:
1. Configurar webhooks no Asaas
2. Testar processamento automático
3. Monitorar primeiros splits reais
4. Ajustar configurações se necessário

---

## 📞 SUPORTE

**Documentação Asaas:**
- Webhooks: https://docs.asaas.com/reference/webhooks
- API: https://docs.asaas.com/reference/api

**Documentação Supabase:**
- Edge Functions: https://supabase.com/docs/guides/functions
- Webhooks: https://supabase.com/docs/guides/functions/webhooks

---

**Status:** ✅ Sistema pronto para apresentação  
**Pendente:** Configuração de webhooks (após aprovação)
