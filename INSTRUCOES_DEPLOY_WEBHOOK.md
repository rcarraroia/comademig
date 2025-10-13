# 🚀 INSTRUÇÕES - Deploy da Edge Function asaas-webhook

**Data:** 11/01/2025  
**Status:** ⏳ AGUARDANDO DEPLOY

---

## ✅ O QUE JÁ FOI FEITO

1. ✅ Código modificado localmente
2. ✅ Commit realizado: `ca6946c`
3. ✅ Push para GitHub: ✅ Concluído
4. ⏳ **Deploy no Supabase:** PENDENTE

---

## 🎯 SITUAÇÃO ATUAL

### Teste Realizado:
```bash
curl https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Resultado:**
```
Status: 405
Response: {"error":"Method not allowed"}
```

**Conclusão:** Edge Function ainda não foi re-deployada no Supabase.

---

## 🚀 COMO FAZER O DEPLOY

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

#### Passo 1: Acessar Dashboard
```
https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
```

#### Passo 2: Ir para Edge Functions
1. No menu lateral, clique em **Edge Functions**
2. Você verá a lista de funções deployadas

#### Passo 3: Encontrar asaas-webhook
- Procure por: `asaas-webhook`
- Status atual: Deployada (versão antiga)

#### Passo 4: Re-deploy
**Opção A: Deploy Manual**
1. Clique nos 3 pontinhos (...) ao lado de `asaas-webhook`
2. Clique em **Deploy**
3. Selecione a branch: `main`
4. Confirme o deploy

**Opção B: Deploy via GitHub Integration**
1. Vá em **Settings** > **Integrations**
2. Conecte com GitHub (se não estiver conectado)
3. Configure auto-deploy da branch `main`
4. Trigger manual do deploy

#### Passo 5: Aguardar Deploy
- Tempo estimado: 1-2 minutos
- Status: Acompanhe na tela de Edge Functions

---

### Opção 2: Via Supabase CLI (Se Disponível)

#### Passo 1: Verificar se CLI está instalada
```bash
supabase --version
```

Se não estiver instalada:
```bash
npm install -g supabase
```

#### Passo 2: Login no Supabase
```bash
supabase login
```

#### Passo 3: Link com o Projeto
```bash
supabase link --project-ref amkelczfwazutrciqtlk
```

#### Passo 4: Deploy da Função
```bash
supabase functions deploy asaas-webhook
```

#### Passo 5: Verificar Deploy
```bash
supabase functions list
```

---

### Opção 3: Via API do Supabase (Avançado)

Se você tiver o Management API Token:

```bash
curl -X POST https://api.supabase.com/v1/projects/amkelczfwazutrciqtlk/functions/asaas-webhook/deploy \
  -H "Authorization: Bearer YOUR_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🧪 COMO TESTAR APÓS DEPLOY

### Teste 1: GET (Health Check)

**Comando:**
```bash
curl https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is active",
  "timestamp": "2025-01-11T18:30:00.000Z"
}
```

**Status esperado:** HTTP 200 OK

---

### Teste 2: OPTIONS (CORS)

**Comando:**
```bash
curl -X OPTIONS https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

**Resposta esperada:** `ok`

**Status esperado:** HTTP 200 OK

---

### Teste 3: POST (Webhook)

**Comando:**
```bash
curl -X POST https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_RECEIVED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_test_456",
      "value": 150.00,
      "status": "RECEIVED",
      "billingType": "PIX",
      "dueDate": "2025-01-18",
      "dateCreated": "2025-01-11"
    }
  }'
```

**Resposta esperada:** HTTP 200 ou 500 (depende dos dados)

---

## 📋 CHECKLIST PÓS-DEPLOY

Após fazer o deploy, execute:

- [ ] Teste GET retorna HTTP 200
- [ ] Teste OPTIONS retorna HTTP 200
- [ ] Teste POST processa (200 ou 500)
- [ ] Configurar webhook no Asaas Sandbox
- [ ] Testar webhook com evento real

---

## 🎯 CONFIGURAR NO ASAAS APÓS DEPLOY

### Passo 1: Acessar Painel Asaas
```
https://sandbox.asaas.com/
```

### Passo 2: Ir para Webhooks
**Menu:** Configurações > Integrações > Webhooks

### Passo 3: Adicionar Webhook
- **URL:** `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook`
- **Versão:** `v3`
- **Fila de sincronização:** `Sim`
- **Tipo de envio:** `Sequencial`

### Passo 4: Selecionar Eventos
Mínimo (5 eventos):
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_REFUNDED
- ✅ PAYMENT_DELETED

### Passo 5: Salvar
- Clique em **Salvar**
- Agora deve aceitar a URL sem erro

### Passo 6: Testar
- Clique em **Testar Webhook**
- Selecione: `PAYMENT_RECEIVED`
- Enviar
- Verificar: HTTP 200 OK

---

## 🚨 TROUBLESHOOTING

### Problema: Deploy não aparece no Dashboard

**Solução:**
1. Verificar se está na branch correta (`main`)
2. Verificar se commit foi enviado para GitHub
3. Aguardar 2-3 minutos
4. Recarregar página do Dashboard

### Problema: GET ainda retorna 405

**Solução:**
1. Verificar se deploy foi concluído
2. Aguardar 1-2 minutos para propagação
3. Limpar cache: `curl -H "Cache-Control: no-cache" ...`
4. Testar em modo anônimo do navegador

### Problema: Asaas ainda diz "URL inválida"

**Solução:**
1. Confirmar que GET retorna 200
2. Testar URL no navegador
3. Verificar se não há firewall bloqueando
4. Usar webhook.site temporariamente

---

## 💡 ALTERNATIVA: Webhook.site

Se o deploy demorar ou houver problemas:

1. Acesse: https://webhook.site/
2. Copie a URL única gerada
3. Configure no Asaas Sandbox
4. Veja os webhooks chegando em tempo real
5. Confirme que Asaas está enviando
6. Depois configure a URL do Supabase

---

## 📊 RESUMO

### Status Atual:
- ✅ Código modificado
- ✅ Commit e push realizados
- ⏳ Deploy no Supabase: **PENDENTE**
- ⏳ Teste GET: Aguardando deploy
- ⏳ Configuração no Asaas: Aguardando deploy

### Próxima Ação:
**FAZER DEPLOY no Supabase Dashboard**

### Após Deploy:
1. Testar GET (deve retornar 200)
2. Configurar no Asaas Sandbox
3. Testar com evento real

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard:** https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
- **Asaas Sandbox:** https://sandbox.asaas.com/
- **Webhook.site:** https://webhook.site/
- **Documentação Asaas:** https://docs.asaas.com/reference/webhooks

---

**Gerado por:** Kiro AI  
**Data:** 11/01/2025
