# Análise das Variáveis de Ambiente e Configurações - COMADEMIG

## Resumo Executivo

Esta análise examina as variáveis de ambiente necessárias para o funcionamento das Edge Functions do sistema COMADEMIG, identificando configurações críticas e possíveis pontos de falha na integração com o gateway de pagamento Asaas.

## Variáveis de Ambiente Identificadas

### 🔴 Variáveis Críticas (Obrigatórias)

#### 1. ASAAS_API_KEY
**Utilizada em:**
- `asaas-create-payment/index.ts`
- `asaas-create-payment-with-split/index.ts`
- `asaas-check-payment/index.ts`

**Função:** Autenticação com a API do Asaas
**Formato:** Token de acesso da API Asaas
**Status:** ⚠️ **CRÍTICA** - Sem esta variável, todas as funções de pagamento falham

#### 2. SUPABASE_URL
**Utilizada em:** Todas as Edge Functions
**Função:** URL base do projeto Supabase
**Valor atual:** `https://amkelczfwazutrciqtlk.supabase.co`
**Status:** ✅ Configurada

#### 3. SUPABASE_ANON_KEY
**Utilizada em:** Funções com autenticação de usuário
**Função:** Chave pública para autenticação de usuários
**Status:** ✅ Configurada

#### 4. SUPABASE_SERVICE_ROLE_KEY
**Utilizada em:** `asaas-webhook/index.ts`
**Função:** Chave com privilégios elevados para webhooks
**Status:** ⚠️ **CRÍTICA** - Necessária para processamento de webhooks

### 🟡 Configurações Hardcoded Identificadas

#### 1. RENUM_WALLET_ID
**Localização:** `asaas-create-payment-with-split/index.ts` (linha 10)
```typescript
const RENUM_WALLET_ID = 'f9c7d1dd-9e52-4e81-8194-8b666f276405'
```
**Problema:** Valor hardcoded no código
**Recomendação:** Mover para variável de ambiente `RENUM_WALLET_ID`

#### 2. Percentuais de Split
**Localização:** `asaas-create-payment-with-split/index.ts` (linhas 45-55)
```typescript
split: [
  {
    walletId: RENUM_WALLET_ID,
    percentualValue: 40.0  // Hardcoded
  },
  {
    walletId: affiliate.asaas_wallet_id,
    percentualValue: 20.0  // Hardcoded
  }
]
```
**Problema:** Percentuais fixos no código
**Recomendação:** Configurar via variáveis de ambiente

## Configuração do Supabase (config.toml)

### Configurações das Edge Functions
```toml
[functions.asaas-create-payment]
verify_jwt = true

[functions.asaas-webhook]
verify_jwt = false  # ⚠️ Webhook não verifica JWT

[functions.asaas-check-payment]
verify_jwt = true

[functions.asaas-create-payment-with-split]
verify_jwt = true

[functions.affiliates-management]
verify_jwt = true
```

### Análise de Segurança
- ✅ **Bom:** Maioria das funções verifica JWT
- ⚠️ **Atenção:** Webhook não verifica JWT (necessário para receber callbacks do Asaas)
- ✅ **Bom:** Funções de pagamento exigem autenticação

## Problemas Identificados

### 🔴 Problemas Críticos

#### 1. Falta de Validação de Variáveis de Ambiente
**Problema:** Código não valida se variáveis críticas estão configuradas
```typescript
// Código atual (problemático)
const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
if (!asaasApiKey) {
  return new Response('Chave da API Asaas não configurada', { status: 500 })
}
```
**Impacto:** Falhas silenciosas se variáveis não estiverem configuradas
**Solução:** Implementar validação robusta no início das funções

#### 2. Inconsistência no Uso de Chaves Supabase
**Problema:** Diferentes funções usam diferentes chaves
- Funções de usuário: `SUPABASE_ANON_KEY`
- Webhook: `SUPABASE_SERVICE_ROLE_KEY`

**Análise:** Correto, mas pode causar confusão
**Recomendação:** Documentar claramente o uso de cada chave

### 🟡 Problemas Moderados

#### 3. Falta de Configuração de Timeout
**Problema:** Requisições HTTP não têm timeout configurado
**Impacto:** Funções podem ficar pendentes indefinidamente
**Solução:** Configurar timeouts apropriados

#### 4. Ausência de Configuração de Rate Limiting
**Problema:** Não há controle de taxa de requisições
**Impacto:** Possível abuso ou sobrecarga da API Asaas
**Solução:** Implementar rate limiting

## Variáveis de Ambiente Recomendadas

### Existentes (Obrigatórias)
```bash
# Supabase
SUPABASE_URL=https://amkelczfwazutrciqtlk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Asaas
ASAAS_API_KEY=<chave_da_api_asaas>
```

### Novas (Recomendadas)
```bash
# Split de Pagamentos
RENUM_WALLET_ID=f9c7d1dd-9e52-4e81-8194-8b666f276405
CONVENTION_SPLIT_PERCENTAGE=40
RENUM_SPLIT_PERCENTAGE=40
AFFILIATE_SPLIT_PERCENTAGE=20

# Configurações de API
ASAAS_API_TIMEOUT=30000
ASAAS_API_BASE_URL=https://www.asaas.com/api/v3

# Configurações de Segurança
WEBHOOK_SECRET=<secret_para_validar_webhooks>
MAX_REQUESTS_PER_MINUTE=60
```

## Verificação de Configuração

### Checklist de Variáveis Críticas
- [ ] `ASAAS_API_KEY` - Chave válida da API Asaas
- [ ] `SUPABASE_URL` - URL do projeto Supabase
- [ ] `SUPABASE_ANON_KEY` - Chave pública Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço Supabase

### Testes de Conectividade Recomendados
1. **Teste da API Asaas:** Fazer requisição GET para `/customers` com a chave
2. **Teste do Supabase:** Verificar conexão com o banco de dados
3. **Teste de Autenticação:** Validar JWT com chave anon
4. **Teste de Webhook:** Simular callback do Asaas

## Configuração no Ambiente de Produção

### Supabase Dashboard
As variáveis de ambiente das Edge Functions devem ser configuradas em:
1. Supabase Dashboard → Project Settings → Edge Functions
2. Adicionar cada variável individualmente
3. Fazer deploy das funções após configuração

### Verificação de Deploy
```bash
# Comando para verificar se as funções estão funcionando
supabase functions list
supabase functions logs asaas-create-payment
```

## Próximos Passos

### Ações Imediatas
1. ✅ **Verificar se `ASAAS_API_KEY` está configurada** no Supabase
2. ✅ **Validar conectividade com API Asaas**
3. ✅ **Testar autenticação das Edge Functions**

### Melhorias Recomendadas
1. 🔄 **Mover configurações hardcoded** para variáveis de ambiente
2. 🔄 **Implementar validação robusta** de variáveis
3. 🔄 **Adicionar timeouts** e rate limiting
4. 🔄 **Implementar logging estruturado**

## Impacto nos Problemas Reportados

### Formulário de Filiação
- **Possível causa:** `ASAAS_API_KEY` não configurada ou inválida
- **Sintoma:** Erro 500 ao tentar criar pagamento

### Sistema de Certificados/Regularização
- **Possível causa:** Falha na autenticação ou configuração
- **Sintoma:** Não consegue gerar métodos de pagamento

### Sistema de Afiliados
- **Possível causa:** `RENUM_WALLET_ID` inválido ou problemas de split
- **Sintoma:** Pagamentos com split não funcionam

---
*Análise realizada em: 09/09/2025*
*Próxima etapa: Análise dos logs de execução das Edge Functions*

