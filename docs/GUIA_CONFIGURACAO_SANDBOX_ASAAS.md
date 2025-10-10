# 🧪 Guia de Configuração do Ambiente Sandbox - Asaas

**Data:** 09/01/2025  
**Objetivo:** Configurar ambiente de testes para pagamentos, split e comissões  
**Status:** Documentação para configuração

---

## 📋 Índice

1. [O que é o Sandbox](#o-que-é-o-sandbox)
2. [Criação da Conta Sandbox](#criação-da-conta-sandbox)
3. [Configuração de Chaves de API](#configuração-de-chaves-de-api)
4. [URLs dos Ambientes](#urls-dos-ambientes)
5. [Configuração para Split de Pagamentos](#configuração-para-split-de-pagamentos)
6. [Como Testar Funcionalidades](#como-testar-funcionalidades)
7. [Diferenças entre Sandbox e Produção](#diferenças-entre-sandbox-e-produção)
8. [Checklist de Configuração](#checklist-de-configuração)

---

## 🎯 O que é o Sandbox

O **Sandbox** é o ambiente de testes do Asaas que funciona de forma muito similar ao ambiente de produção, mas **sem movimentação financeira real**. Permite testar:

- ✅ Criação de clientes
- ✅ Geração de cobranças
- ✅ Pagamentos simulados
- ✅ Split de pagamentos
- ✅ Transferências entre contas
- ✅ Webhooks
- ✅ Comissões de afiliados

**Importante:** Dados criados no Sandbox **não afetam** o ambiente de produção e vice-versa.

---

## 🚀 Criação da Conta Sandbox

### Passo 1: Acessar o Sandbox

1. Acesse: **https://sandbox.asaas.com**
2. Clique em "Criar conta gratuitamente"
3. Preencha os dados solicitados
4. Confirme seu email

### Passo 2: Completar Cadastro

1. Faça login na conta sandbox criada
2. Complete as informações do perfil
3. **Não é necessário** validar documentos ou dados bancários no sandbox

**⚠️ Atenção:**
- Use **emails e telefones de teste** (não use dados reais de clientes)
- Sugestão: use emails como `teste+sandbox@seudominio.com`
- Não use números aleatórios como (51) 9999-9999

---

## 🔑 Configuração de Chaves de API

### Passo 1: Gerar Chave de API Sandbox

1. Faça login em **https://sandbox.asaas.com**
2. Clique no **ícone do perfil** (bonequinho cinza no canto superior direito)
3. Vá em **Integrações > Chave da API**
4. Clique em **"Gerar nova chave"**
5. Dê um nome para a chave (ex: "Desenvolvimento COMADEMIG")
6. **Copie a chave imediatamente** (ela só será exibida uma vez!)

### Formato da Chave

```
Sandbox:  $aact_hmlg_xxxxxxxxxxxxxxxxxxxxxxxx
Produção: $aact_prod_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 2: Armazenar a Chave com Segurança

**No Supabase:**

1. Acesse o painel do Supabase
2. Vá em **Settings > Edge Functions > Secrets**
3. Adicione as variáveis:

```env
ASAAS_API_KEY=<sua_chave_sandbox>
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
```

**Localmente (.env):**

```env
VITE_ASAAS_API_URL=https://api-sandbox.asaas.com/v3
# Não armazene a chave no frontend!
```

---

## 🌐 URLs dos Ambientes

### Ambiente Sandbox (Testes)

```
API: https://api-sandbox.asaas.com/v3
Web: https://sandbox.asaas.com
```

### Ambiente Produção

```
API: https://api.asaas.com/v3
Web: https://www.asaas.com
```

### Configuração no Código

**Edge Functions (Supabase):**

```typescript
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://api-sandbox.asaas.com/v3';
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');

// Headers para requisições
const headers = {
  'access_token': ASAAS_API_KEY,
  'Content-Type': 'application/json',
  'User-Agent': 'COMADEMIG-System'
};
```

---

## 💰 Configuração para Split de Pagamentos

### Conceito de Wallet ID

O **Wallet ID** é o identificador único de uma conta Asaas usado para:
- Split de pagamentos (dividir valor entre múltiplas contas)
- Transferências entre contas Asaas

### Passo 1: Criar Subcontas para Testes

Para testar split, você precisa criar **subcontas** que representarão:
1. **COMADEMIG** (conta principal - não precisa de wallet)
2. **RENUM** (subconta - precisa de wallet ID)
3. **Afiliados** (subcontas - cada um com seu wallet ID)

**Criar Subconta via API:**

```bash
curl --request POST \
  --url https://api-sandbox.asaas.com/v3/accounts \
  --header 'access_token: SUA_CHAVE_SANDBOX' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "RENUM Teste",
    "email": "renum+teste@comademig.org.br",
    "cpfCnpj": "12345678901",
    "birthDate": "1990-01-01",
    "phone": "31999999999",
    "mobilePhone": "31999999999",
    "address": "Rua Teste",
    "addressNumber": "123",
    "province": "Centro",
    "postalCode": "30000000"
  }'
```

**Resposta:**

```json
{
  "id": "acc_xxxxxxxxxx",
  "name": "RENUM Teste",
  "email": "renum+teste@comademig.org.br",
  "walletId": "wal_xxxxxxxxxx",  // ← ESTE É O WALLET ID!
  "apiKey": "$aact_hmlg_yyyyyyyy"
}
```

### Passo 2: Configurar Wallet IDs no Sistema

**No Supabase (Variáveis de Ambiente):**

```env
RENUM_WALLET_ID=wal_xxxxxxxxxx
```

**Na Tabela `affiliates`:**

Quando um afiliado se cadastra, armazene o `asaas_wallet_id` dele:

```sql
INSERT INTO affiliates (
  user_id,
  display_name,
  cpf_cnpj,
  asaas_wallet_id,  -- Wallet ID da subconta do afiliado
  status
) VALUES (
  'user-123',
  'João Afiliado',
  '12345678901',
  'wal_afiliado_123',
  'pending'
);
```

### Passo 3: Configurar Split na Cobrança

**Exemplo de Split Triplo (40%-40%-20%):**

```typescript
// Criar cobrança com split
const cobranca = {
  customer: 'cus_xxxxxxxxxx',
  billingType: 'PIX',
  value: 1000.00,
  dueDate: '2025-01-15',
  description: 'Filiação COMADEMIG',
  split: [
    {
      walletId: process.env.RENUM_WALLET_ID,  // RENUM
      percentualValue: 40.00  // 40%
    },
    {
      walletId: affiliateWalletId,  // Afiliado
      percentualValue: 20.00  // 20%
    }
    // COMADEMIG recebe os 40% restantes automaticamente (conta principal)
  ]
};
```

---

## 🧪 Como Testar Funcionalidades

### 1. Testar Criação de Cliente

```bash
curl --request POST \
  --url https://api-sandbox.asaas.com/v3/customers \
  --header 'access_token: SUA_CHAVE_SANDBOX' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Cliente Teste",
    "cpfCnpj": "12345678901",
    "email": "cliente+teste@example.com"
  }'
```

### 2. Testar Criação de Cobrança

```bash
curl --request POST \
  --url https://api-sandbox.asaas.com/v3/payments \
  --header 'access_token: SUA_CHAVE_SANDBOX' \
  --header 'Content-Type: application/json' \
  --data '{
    "customer": "cus_xxxxxxxxxx",
    "billingType": "PIX",
    "value": 100.00,
    "dueDate": "2025-01-15"
  }'
```

### 3. Simular Pagamento no Sandbox

**Opção 1: Via Interface Web**
1. Acesse https://sandbox.asaas.com
2. Vá em "Cobranças"
3. Encontre a cobrança criada
4. Clique em "Simular Pagamento"

**Opção 2: Via API (Webhook Manual)**
1. Configure um webhook no Supabase
2. Envie manualmente um payload de teste simulando pagamento confirmado

### 4. Testar Split de Pagamento

```typescript
// 1. Criar cobrança com split
const cobranca = await criarCobrancaComSplit({
  customerId: 'cus_xxx',
  value: 1000,
  splits: [
    { walletId: 'wal_renum', percentage: 40 },
    { walletId: 'wal_afiliado', percentage: 20 }
  ]
});

// 2. Simular pagamento
await simularPagamento(cobranca.id);

// 3. Verificar splits processados
const splits = await buscarSplits(cobranca.id);
console.log(splits); // Deve mostrar 3 splits (COMADEMIG, RENUM, Afiliado)
```

### 5. Testar Transferências

```bash
curl --request POST \
  --url https://api-sandbox.asaas.com/v3/transfers \
  --header 'access_token: SUA_CHAVE_SANDBOX' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 100.00,
    "walletId": "wal_destinatario"
  }'
```

---

## ⚖️ Diferenças entre Sandbox e Produção

| Aspecto | Sandbox | Produção |
|---------|---------|----------|
| **Movimentação Financeira** | ❌ Simulada | ✅ Real |
| **Chave de API** | `$aact_hmlg_...` | `$aact_prod_...` |
| **URL da API** | `api-sandbox.asaas.com` | `api.asaas.com` |
| **Validação de Documentos** | ❌ Não necessária | ✅ Obrigatória |
| **Clientes Estrangeiros** | ✅ Permitido | ⚠️ Precisa liberação |
| **Notificações (Email/SMS)** | ✅ Funcionam | ✅ Funcionam |
| **Webhooks** | ✅ Funcionam | ✅ Funcionam |
| **Pagamentos** | 🧪 Simulados | 💰 Reais |
| **Transferências** | 🧪 Simuladas | 💰 Reais |

**⚠️ Importante:**
- Notificações de email e SMS **funcionam normalmente** no Sandbox
- **Não use emails ou telefones reais** de clientes no Sandbox
- Use seus próprios dados de teste

---

## ✅ Checklist de Configuração

### Configuração Inicial

- [ ] Criar conta no Sandbox (https://sandbox.asaas.com)
- [ ] Gerar chave de API Sandbox
- [ ] Armazenar chave no Supabase (variável de ambiente)
- [ ] Configurar URL do Sandbox no código

### Configuração para Split

- [ ] Criar subconta para RENUM no Sandbox
- [ ] Obter Wallet ID da RENUM
- [ ] Armazenar `RENUM_WALLET_ID` no Supabase
- [ ] Criar subcontas de teste para afiliados
- [ ] Obter Wallet IDs dos afiliados de teste

### Testes Básicos

- [ ] Testar criação de cliente
- [ ] Testar criação de cobrança simples
- [ ] Testar simulação de pagamento
- [ ] Verificar webhook funcionando

### Testes de Split

- [ ] Criar cobrança com split triplo (40%-40%-20%)
- [ ] Simular pagamento da cobrança
- [ ] Verificar que 3 splits foram criados
- [ ] Validar percentuais corretos
- [ ] Verificar transferências para RENUM e Afiliado
- [ ] Confirmar que COMADEMIG recebeu 40%

### Testes de Comissões

- [ ] Criar afiliado de teste
- [ ] Cadastrar usuário com código de indicação
- [ ] Criar pagamento para usuário indicado
- [ ] Verificar split configurado automaticamente
- [ ] Confirmar pagamento
- [ ] Verificar comissão registrada
- [ ] Validar notificação para afiliado

---

## 🔧 Configuração no Código COMADEMIG

### 1. Variáveis de Ambiente (Supabase)

```env
# Sandbox
ASAAS_API_KEY=$aact_hmlg_xxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_API_URL=https://api-sandbox.asaas.com/v3
RENUM_WALLET_ID=wal_xxxxxxxxxx

# Produção (quando migrar)
# ASAAS_API_KEY=$aact_prod_xxxxxxxxxxxxxxxxxxxxxxxx
# ASAAS_API_URL=https://api.asaas.com/v3
# RENUM_WALLET_ID=wal_yyyyyyyyyy
```

### 2. Edge Function Atualizada

```typescript
// supabase/functions/asaas-configure-split/index.ts

const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL');
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
const RENUM_WALLET_ID = Deno.env.get('RENUM_WALLET_ID');

// Validar configuração
if (!ASAAS_API_KEY || !RENUM_WALLET_ID) {
  throw new Error('Variáveis de ambiente não configuradas');
}

// Configurar split triplo
const splits = [
  {
    walletId: RENUM_WALLET_ID,
    percentualValue: 40.00  // RENUM 40%
  },
  {
    walletId: affiliateWalletId,
    percentualValue: 20.00  // Afiliado 20%
  }
  // COMADEMIG recebe 40% automaticamente
];
```

### 3. Migração para Produção

Quando estiver pronto para produção:

1. Criar conta real no Asaas (https://www.asaas.com)
2. Gerar chave de API de produção
3. Criar subconta real para RENUM
4. Obter Wallet ID real da RENUM
5. Atualizar variáveis de ambiente:
   - `ASAAS_API_KEY` → chave de produção
   - `ASAAS_API_URL` → `https://api.asaas.com/v3`
   - `RENUM_WALLET_ID` → wallet real da RENUM
6. Testar em produção com valores pequenos primeiro

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **Guia de Integrações:** https://docs.asaas.com/docs/getting-started
- **Referência da API:** https://docs.asaas.com/reference
- **Como Testar no Sandbox:** https://docs.asaas.com/docs/how-to-test-features-in-sandbox

### Links Úteis

- **Sandbox:** https://sandbox.asaas.com
- **Produção:** https://www.asaas.com
- **Suporte:** https://ajuda.asaas.com

---

## ⚠️ Avisos Importantes

1. **Nunca exponha a chave de API** no frontend ou em repositórios públicos
2. **Use apenas dados de teste** no Sandbox (não use dados reais de clientes)
3. **Teste extensivamente** no Sandbox antes de migrar para produção
4. **Valide todos os fluxos** de split e comissões no Sandbox
5. **Documente** os Wallet IDs de teste para referência futura

---

**Última atualização:** 09/01/2025  
**Versão:** 1.0  
**Status:** Pronto para uso
