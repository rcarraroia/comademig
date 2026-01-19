# 🚀 GUIA COMPLETO: Migração Sandbox → Produção (Asaas)

**Data**: 2025-11-28  
**Sistema**: COMADEMIG  
**Objetivo**: Configurar ambiente de produção no Supabase e Vercel

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Obter Credenciais de Produção Asaas](#obter-credenciais-de-produção-asaas)
3. [Configurar Supabase (Edge Functions)](#configurar-supabase-edge-functions)
4. [Configurar Vercel (Frontend)](#configurar-vercel-frontend)
5. [Configurar Webhooks Asaas](#configurar-webhooks-asaas)
6. [Testar Ambiente de Produção](#testar-ambiente-de-produção)
7. [Rollback (se necessário)](#rollback-se-necessário)
8. [Checklist Final](#checklist-final)

---

## 🎯 PRÉ-REQUISITOS

### ✅ O que você precisa ter:

- [ ] Conta Asaas **APROVADA** para produção
- [ ] Acesso ao Dashboard Supabase
- [ ] Acesso ao Dashboard Vercel
- [ ] Acesso ao Dashboard Asaas (produção)
- [ ] Backup das credenciais sandbox (para rollback)

### ⚠️ IMPORTANTE:

**Ambiente Sandbox vs Produção:**

| Item | Sandbox | Produção |
|------|---------|----------|
| **API Key** | `$aact_hmlg_...` | `$aact_prod_...` |
| **Base URL** | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| **Webhook URL** | Pode ser localhost/teste | **DEVE** ser HTTPS público |
| **Cobranças** | Simuladas (não reais) | **REAIS** (dinheiro real!) |
| **Cartões** | Cartões de teste | Cartões reais |

---

## 🔑 PASSO 1: OBTER CREDENCIAIS DE PRODUÇÃO ASAAS

### 1.1 Acessar Dashboard Asaas Produção

1. Acesse: https://www.asaas.com/login
2. Faça login com sua conta **APROVADA** para produção
3. Vá em: **Configurações** > **Integrações** > **API**

### 1.2 Gerar API Key de Produção

```
⚠️ ATENÇÃO: Esta chave dá acesso a cobranças REAIS!
```

1. Clique em **"Gerar nova chave de API"**
2. Dê um nome: `COMADEMIG - Produção`
3. **COPIE A CHAVE** (formato: `$aact_prod_...`)
4. **GUARDE EM LOCAL SEGURO** (não commitar no Git!)

**Exemplo de chave de produção:**
```
$aact_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 1.3 Obter Wallet ID (para splits de afiliados)

1. No Dashboard Asaas, vá em: **Configurações** > **Conta**
2. Copie o **ID da Carteira** (formato: UUID)
3. Este será usado para configurar splits de comissão

---

## 🔧 PASSO 2: CONFIGURAR SUPABASE (EDGE FUNCTIONS)

### 2.1 Acessar Secrets do Supabase

**Via Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
2. Vá em: **Settings** > **Edge Functions** > **Secrets**

**Via CLI (recomendado):**
```powershell
# Verificar secrets atuais
supabase secrets list --project-ref amkelczfwazutrciqtlk
```

### 2.2 Atualizar Secrets de Produção

**⚠️ BACKUP PRIMEIRO:**
```powershell
# Salvar secrets atuais (sandbox)
supabase secrets list --project-ref amkelczfwazutrciqtlk > secrets_backup_sandbox.txt
```

**Configurar secrets de produção:**

```powershell
# 1. API Key de PRODUÇÃO do Asaas
supabase secrets set ASAAS_API_KEY="$aact_prod_SUA_CHAVE_AQUI" --project-ref amkelczfwazutrciqtlk

# 2. Base URL de PRODUÇÃO
supabase secrets set ASAAS_BASE_URL="https://api.asaas.com/v3" --project-ref amkelczfwazutrciqtlk

# 3. Ambiente (produção)
supabase secrets set ASAAS_ENVIRONMENT="production" --project-ref amkelczfwazutrciqtlk

# 4. Webhook Token (gerar novo token seguro)
supabase secrets set ASAAS_WEBHOOK_TOKEN="$(openssl rand -hex 32)" --project-ref amkelczfwazutrciqtlk

# 5. Wallet ID para splits (copiar do Dashboard Asaas)
supabase secrets set ASAAS_WALLET_ID="seu-wallet-id-aqui" --project-ref amkelczfwazutrciqtlk
```

**Verificar secrets configurados:**
```powershell
supabase secrets list --project-ref amkelczfwazutrciqtlk
```

**Resultado esperado:**
```
ASAAS_API_KEY (hidden)
ASAAS_BASE_URL
ASAAS_ENVIRONMENT
ASAAS_WEBHOOK_TOKEN (hidden)
ASAAS_WALLET_ID
SUPABASE_SERVICE_ROLE_KEY (hidden)
```

### 2.3 Redeploy das Edge Functions

**Após atualizar secrets, é OBRIGATÓRIO fazer redeploy:**

```powershell
# Redeploy de TODAS as Edge Functions
supabase functions deploy --project-ref amkelczfwazutrciqtlk

# Ou redeploy individual (se preferir testar uma por vez)
supabase functions deploy asaas-create-customer --project-ref amkelczfwazutrciqtlk
supabase functions deploy asaas-process-card --project-ref amkelczfwazutrciqtlk
supabase functions deploy asaas-webhook --project-ref amkelczfwazutrciqtlk
# ... etc
```

**Verificar logs após deploy:**
```powershell
supabase functions logs asaas-create-customer --project-ref amkelczfwazutrciqtlk --tail
```

---

## 🌐 PASSO 3: CONFIGURAR VERCEL (FRONTEND)

### 3.1 Acessar Variáveis de Ambiente Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **comademig**
3. Vá em: **Settings** > **Environment Variables**

### 3.2 Configurar Variáveis de Produção

**⚠️ IMPORTANTE: Variáveis com prefixo `VITE_` são expostas no frontend!**

**Variáveis a configurar:**

| Variável | Valor | Ambiente | Exposta? |
|----------|-------|----------|----------|
| `VITE_SUPABASE_URL` | `https://amkelczfwazutrciqtlk.supabase.co` | Production | ✅ Sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` (anon key) | Production | ✅ Sim |
| `VITE_ASAAS_ENVIRONMENT` | `production` | Production | ✅ Sim |
| `VITE_ASAAS_BASE_URL` | `https://api.asaas.com/v3` | Production | ✅ Sim |

**❌ NÃO configurar no Vercel (ficam apenas no Supabase):**
- `ASAAS_API_KEY` (secret, apenas backend)
- `ASAAS_WEBHOOK_TOKEN` (secret, apenas backend)
- `SUPABASE_SERVICE_ROLE_KEY` (secret, apenas backend)

### 3.3 Adicionar Variáveis via Dashboard

**Para cada variável:**

1. Clique em **"Add New"**
2. **Key**: Nome da variável (ex: `VITE_ASAAS_ENVIRONMENT`)
3. **Value**: Valor (ex: `production`)
4. **Environment**: Selecione **Production**
5. Clique em **"Save"**

### 3.4 Redeploy do Frontend

**Após adicionar variáveis:**

1. Vá em: **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Clique em **"Redeploy"**
4. Aguarde build completar (~2-5 minutos)

**Ou via CLI:**
```bash
vercel --prod
```

---

## 🔗 PASSO 4: CONFIGURAR WEBHOOKS ASAAS

### 4.1 Obter URL do Webhook

**URL da Edge Function:**
```
https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
```

### 4.2 Obter Webhook Token

```powershell
# Ver token configurado (será mostrado apenas uma vez)
supabase secrets list --project-ref amkelczfwazutrciqtlk
```

**Se não souber o token, gere um novo:**
```powershell
# Gerar novo token
$webhookToken = openssl rand -hex 32
echo $webhookToken

# Configurar no Supabase
supabase secrets set ASAAS_WEBHOOK_TOKEN="$webhookToken" --project-ref amkelczfwazutrciqtlk
```

### 4.3 Configurar no Dashboard Asaas

1. Acesse: https://www.asaas.com/configuracoes/webhooks
2. Clique em **"Adicionar Webhook"**

**Configurações:**

| Campo | Valor |
|-------|-------|
| **Nome** | COMADEMIG - Produção |
| **URL** | `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook` |
| **Método** | POST |
| **Token** | (colar o token gerado) |
| **Versão API** | v3 |
| **Status** | Ativo |

**Eventos a habilitar:**

- ✅ `PAYMENT_CREATED` - Cobrança criada
- ✅ `PAYMENT_UPDATED` - Cobrança atualizada
- ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado
- ✅ `PAYMENT_RECEIVED` - Pagamento recebido
- ✅ `PAYMENT_OVERDUE` - Pagamento vencido
- ✅ `PAYMENT_DELETED` - Cobrança deletada
- ✅ `PAYMENT_REFUNDED` - Pagamento estornado
- ✅ `PAYMENT_RECEIVED_IN_CASH` - Pagamento em dinheiro
- ✅ `PAYMENT_CHARGEBACK_REQUESTED` - Chargeback solicitado
- ✅ `PAYMENT_CHARGEBACK_DISPUTE` - Disputa de chargeback

3. Clique em **"Salvar"**

### 4.4 Testar Webhook

**No Dashboard Asaas:**
1. Vá em: **Webhooks** > **COMADEMIG - Produção**
2. Clique em **"Testar Webhook"**
3. Selecione evento: `PAYMENT_CREATED`
4. Clique em **"Enviar Teste"**

**Verificar logs no Supabase:**
```powershell
supabase functions logs asaas-webhook --project-ref amkelczfwazutrciqtlk --tail
```

**Resultado esperado:**
```
✅ Webhook recebido e processado com sucesso
✅ Token validado
✅ Evento processado: PAYMENT_CREATED
```

---

## 🧪 PASSO 5: TESTAR AMBIENTE DE PRODUÇÃO

### 5.1 Criar Arquivo de Teste Local

**Criar `.env.production.local`:**
```bash
# NÃO COMMITAR ESTE ARQUIVO!
VITE_SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_ASAAS_ENVIRONMENT=production
VITE_ASAAS_BASE_URL=https://api.asaas.com/v3
```

**Adicionar ao `.gitignore`:**
```bash
echo ".env.production.local" >> .gitignore
```

### 5.2 Testar Localmente

```bash
# Build com variáveis de produção
npm run build

# Testar build localmente
npm run preview
```

### 5.3 Testes Essenciais

**⚠️ ATENÇÃO: Testes em produção usam DINHEIRO REAL!**

**Checklist de testes:**

- [ ] **Login/Cadastro**: Criar conta de teste
- [ ] **Criar Cliente Asaas**: Verificar se cliente é criado
- [ ] **Gerar Cobrança**: Criar cobrança de R$ 0,01 (teste mínimo)
- [ ] **Webhook**: Verificar se webhook é recebido
- [ ] **Logs**: Verificar logs das Edge Functions
- [ ] **Banco de Dados**: Verificar se dados são salvos

**Comandos úteis:**

```powershell
# Ver logs em tempo real
supabase functions logs asaas-create-customer --project-ref amkelczfwazutrciqtlk --tail

# Verificar dados no banco
python verify_production_data.py
```

### 5.4 Script de Verificação

**Criar `verify_production_data.py`:**
```python
#!/usr/bin/env python3
from supabase import create_client
import os

SUPABASE_URL = "https://amkelczfwazutrciqtlk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Verificar últimas cobranças
cobrancas = supabase.table('asaas_cobrancas').select('*').order('created_at', desc=True).limit(5).execute()
print(f"Últimas 5 cobranças: {len(cobrancas.data)}")

for c in cobrancas.data:
    print(f"  - {c['id']}: R$ {c['value']} - {c['status']}")
```

---

## 🔄 PASSO 6: ROLLBACK (SE NECESSÁRIO)

### 6.1 Quando fazer rollback?

- ❌ Erros críticos em produção
- ❌ Cobranças não sendo processadas
- ❌ Webhooks falhando constantemente
- ❌ Dados não sendo salvos

### 6.2 Restaurar Ambiente Sandbox

**Restaurar secrets do Supabase:**
```powershell
# Restaurar secrets de sandbox
supabase secrets set ASAAS_API_KEY="$aact_hmlg_SUA_CHAVE_SANDBOX" --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_BASE_URL="https://sandbox.asaas.com/api/v3" --project-ref amkelczfwazutrciqtlk
supabase secrets set ASAAS_ENVIRONMENT="sandbox" --project-ref amkelczfwazutrciqtlk

# Redeploy
supabase functions deploy --project-ref amkelczfwazutrciqtlk
```

**Restaurar variáveis do Vercel:**
1. Dashboard Vercel > Settings > Environment Variables
2. Alterar `VITE_ASAAS_ENVIRONMENT` para `sandbox`
3. Alterar `VITE_ASAAS_BASE_URL` para `https://sandbox.asaas.com/api/v3`
4. Redeploy

---

## ✅ PASSO 7: CHECKLIST FINAL

### Antes de ir para produção:

**Supabase:**
- [ ] Secrets de produção configurados
- [ ] Edge Functions redeployadas
- [ ] Logs sem erros
- [ ] Banco de dados com políticas RLS corretas

**Vercel:**
- [ ] Variáveis de ambiente configuradas
- [ ] Build de produção bem-sucedido
- [ ] Site acessível e funcionando

**Asaas:**
- [ ] Conta aprovada para produção
- [ ] API Key de produção gerada
- [ ] Webhooks configurados e testados
- [ ] Eventos habilitados corretamente

**Testes:**
- [ ] Criar cliente funciona
- [ ] Gerar cobrança funciona
- [ ] Webhook é recebido
- [ ] Dados são salvos no banco
- [ ] Logs estão limpos

**Segurança:**
- [ ] `.env` não está no Git
- [ ] Secrets não estão expostos
- [ ] Webhook token é forte
- [ ] HTTPS em todas as URLs

**Documentação:**
- [ ] Credenciais salvas em local seguro
- [ ] Backup de configurações feito
- [ ] Equipe informada sobre mudança

---

## 📊 MONITORAMENTO PÓS-PRODUÇÃO

### Logs a monitorar:

```powershell
# Edge Functions
supabase functions logs asaas-webhook --project-ref amkelczfwazutrciqtlk --tail

# Vercel
vercel logs --follow
```

### Métricas importantes:

- Taxa de sucesso de cobranças
- Tempo de resposta das Edge Functions
- Erros de webhook
- Falhas de pagamento

### Alertas recomendados:

- ⚠️ Taxa de erro > 5%
- ⚠️ Webhook não recebido em 5 minutos
- ⚠️ Edge Function timeout
- ⚠️ Banco de dados inacessível

---

## 📞 SUPORTE

**Documentação Asaas:**
- API: https://docs.asaas.com/reference
- Webhooks: https://docs.asaas.com/docs/webhooks

**Supabase:**
- Edge Functions: https://supabase.com/docs/guides/functions
- Secrets: https://supabase.com/docs/guides/functions/secrets

**Vercel:**
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables

---

## 🎯 RESUMO EXECUTIVO

**Passos principais:**

1. ✅ Obter API Key de produção do Asaas
2. ✅ Configurar secrets no Supabase
3. ✅ Redeploy Edge Functions
4. ✅ Configurar variáveis no Vercel
5. ✅ Redeploy frontend
6. ✅ Configurar webhooks no Asaas
7. ✅ Testar ambiente completo
8. ✅ Monitorar logs e métricas

**Tempo estimado:** 30-60 minutos

**Risco:** Médio (cobranças reais envolvidas)

**Rollback:** Possível a qualquer momento

---

**BOA SORTE! 🚀**

**Lembre-se: Em produção, cada cobrança é REAL. Teste bem antes de liberar para usuários!**
