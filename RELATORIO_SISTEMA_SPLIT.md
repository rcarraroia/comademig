# 📊 RELATÓRIO COMPLETO: SISTEMA DE SPLIT DE PAGAMENTOS

**Data:** 13/10/2025  
**Solicitação:** Verificar se o sistema de split está funcionando corretamente  
**Ambiente:** Sandbox Asaas

---

## 🎯 RESUMO EXECUTIVO

**Status Geral:** ⚠️ **SISTEMA DE SPLIT NÃO ESTÁ ATIVO**

O sistema de split está **implementado no código** mas **NÃO está sendo executado** durante o processo de filiação.

---

## 1️⃣ ANÁLISE DO CÓDIGO

### ✅ O QUE EXISTE

#### Edge Functions Implementadas:

1. **`asaas-configure-split`** - Configuração de splits
   - Localização: `supabase/functions/asaas-configure-split/index.ts`
   - Status: ✅ Implementada e funcional
   - Função: Criar splits triplos (COMADEMIG, RENUM, Afiliado)

2. **`asaas-process-splits`** - Processamento de splits
   - Localização: `supabase/functions/asaas-process-splits/index.ts`
   - Status: ✅ Implementada e funcional
   - Função: Ativar splits no Asaas após pagamento confirmado

3. **Webhook Integration**
   - Localização: `supabase/functions/asaas-webhook/index.ts`
   - Status: ✅ Implementada
   - Função: Chama `asaas-process-splits` automaticamente após confirmação de pagamento

### ❌ O QUE NÃO ESTÁ FUNCIONANDO

#### Problema Principal: Split NÃO é criado durante a filiação

**Evidência:**
```bash
# Busca no código por chamadas a configure-split
Resultado: NENHUMA CHAMADA ENCONTRADA
```

**Conclusão:** A Edge Function `asaas-configure-split` existe mas **nunca é chamada** durante o processo de filiação.

---

## 2️⃣ CONFIGURAÇÃO DE SPLITS

### Regras Implementadas (no código):

#### Filiação (40% + 40% + 20%)
- **COMADEMIG:** 40% (recebe direto)
- **RENUM:** 40% (via split Asaas)
- **Afiliado:** 20% (via split Asaas, se houver)

#### Serviços (60% + 40%)
- **COMADEMIG:** 60% (recebe direto)
- **RENUM:** 40% (via split Asaas)

#### Eventos (70% + 30%)
- **COMADEMIG:** 70% (recebe direto)
- **RENUM:** 30% (via split Asaas)

#### Publicidade e Outros (100%)
- **COMADEMIG:** 100% (recebe direto)

### Variáveis de Ambiente Necessárias:

```env
RENUM_WALLET_ID=<wallet_id_da_renum>  # ⚠️ Precisa ser configurado
```

---

## 3️⃣ VERIFICAÇÃO NO BANCO DE DADOS

### Resultados da Verificação:

```
✅ Tabela 'asaas_splits' existe
📊 Total de splits no banco: 0

⚠️ NENHUM SPLIT ENCONTRADO NO BANCO
```

**Conclusão:** Nenhum split foi criado até agora.

### Tabelas Relacionadas:

| Tabela | Status | Registros |
|--------|--------|-----------|
| asaas_splits | ✅ Existe | 0 |
| split_configurations | ❌ Não existe | - |
| affiliates | ⚠️ Existe com erro | - |
| asaas_cobrancas | ✅ Existe | 0 |

**Problema identificado:** Coluna `asaas_wallet_id` não existe na tabela `affiliates`.

---

## 4️⃣ FLUXO ATUAL vs FLUXO ESPERADO

### ❌ FLUXO ATUAL (Sem Split)

```
1. Usuário preenche formulário de filiação
2. Sistema cria cliente no Asaas ✅
3. Sistema cria assinatura no Asaas ✅
4. Sistema atualiza perfil ✅
5. Sistema cria user_subscription ✅
6. ❌ SPLIT NÃO É CRIADO
7. Webhook recebe confirmação de pagamento
8. Webhook tenta processar splits
9. ❌ Nenhum split encontrado para processar
```

### ✅ FLUXO ESPERADO (Com Split)

```
1. Usuário preenche formulário de filiação
2. Sistema cria cliente no Asaas ✅
3. Sistema cria assinatura no Asaas ✅
4. ✅ Sistema chama asaas-configure-split
   - Cria split COMADEMIG (40%)
   - Cria split RENUM (40%)
   - Cria split Afiliado (20%, se houver)
5. Sistema atualiza perfil ✅
6. Sistema cria user_subscription ✅
7. Webhook recebe confirmação de pagamento
8. Webhook chama asaas-process-splits
9. ✅ Splits são ativados no Asaas
10. ✅ Transferências automáticas configuradas
```

---

## 5️⃣ ONDE ADICIONAR A CHAMADA DE SPLIT

### Arquivo: `src/hooks/useFiliacaoPayment.ts`

**Localização:** Após criar a assinatura no Asaas (linha ~230)

**Código atual:**
```typescript
const subscriptionResult = await createSubscription.mutateAsync(subscriptionData);

// 4. Atualizar perfil do usuário
setPaymentStatus('updating_profile');
```

**Código necessário:**
```typescript
const subscriptionResult = await createSubscription.mutateAsync(subscriptionData);

// 3.5. Configurar split de pagamento (NOVO)
try {
  console.log('🔄 Configurando split de pagamento...');
  
  const { data: splitData, error: splitError } = await supabase.functions.invoke(
    'asaas-configure-split',
    {
      body: {
        cobrancaId: subscriptionResult.id,
        serviceType: 'filiacao',
        totalValue: finalPrice,
        affiliateId: affiliateInfo?.affiliateId || null
      }
    }
  );
  
  if (splitError) {
    console.error('Erro ao configurar split:', splitError);
    // Não falha o processo - apenas loga
  } else {
    console.log('✅ Split configurado:', splitData);
  }
} catch (error) {
  console.error('Erro ao configurar split:', error);
  // Não falha o processo principal
}

// 4. Atualizar perfil do usuário
setPaymentStatus('updating_profile');
```

---

## 6️⃣ PROBLEMAS IDENTIFICADOS

### Problema 1: Split não é criado durante filiação
**Severidade:** 🔴 ALTA  
**Impacto:** Nenhum split está sendo configurado  
**Solução:** Adicionar chamada para `asaas-configure-split` após criar assinatura

### Problema 2: Variável RENUM_WALLET_ID não configurada
**Severidade:** 🔴 ALTA  
**Impacto:** Split para RENUM falhará  
**Solução:** Configurar `RENUM_WALLET_ID` nas variáveis de ambiente do Supabase

### Problema 3: Coluna asaas_wallet_id não existe em affiliates
**Severidade:** 🟡 MÉDIA  
**Impacto:** Split para afiliados falhará  
**Solução:** Adicionar coluna `asaas_wallet_id` na tabela `affiliates`

### Problema 4: Tabela asaas_cobrancas vazia
**Severidade:** 🟡 MÉDIA  
**Impacto:** Não há registro de cobranças para vincular splits  
**Solução:** Criar registro em `asaas_cobrancas` ao criar assinatura

---

## 7️⃣ TESTE NO SANDBOX

### Por que não viu splits no sandbox:

1. ❌ Split não foi criado (código não chama a função)
2. ❌ Nenhum registro em `asaas_splits`
3. ❌ Webhook não tinha splits para processar

### Para testar splits no sandbox:

**Pré-requisitos:**
1. ✅ Configurar `RENUM_WALLET_ID` no Supabase
2. ✅ Adicionar coluna `asaas_wallet_id` em `affiliates`
3. ✅ Adicionar chamada para `asaas-configure-split` no código
4. ✅ Criar registro em `asaas_cobrancas` ao criar assinatura

**Teste:**
1. Fazer nova filiação
2. Verificar logs: "🔄 Configurando split de pagamento..."
3. Verificar banco: `SELECT * FROM asaas_splits`
4. Simular pagamento no Asaas
5. Verificar webhook: "Processing payment splits..."
6. Verificar splits ativados no Asaas

---

## 8️⃣ ARQUITETURA DO SISTEMA DE SPLIT

### Componentes:

```
┌─────────────────────────────────────────────────────────┐
│                    FILIAÇÃO                             │
│  (src/hooks/useFiliacaoPayment.ts)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         asaas-configure-split                           │
│  (supabase/functions/asaas-configure-split)             │
│                                                          │
│  • Cria splits no Asaas (RENUM, Afiliado)              │
│  • Registra splits no banco (asaas_splits)              │
│  • COMADEMIG recebe direto (sem split)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS                             │
│  Tabela: asaas_splits                                   │
│  Status: PENDING                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         PAGAMENTO CONFIRMADO                            │
│  (Webhook do Asaas)                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│         asaas-process-splits                            │
│  (supabase/functions/asaas-process-splits)              │
│                                                          │
│  • Ativa splits no Asaas                                │
│  • Atualiza status: PENDING → PROCESSED                │
│  • Registra comissões de afiliados                      │
└─────────────────────────────────────────────────────────┘
```

---

## 9️⃣ CHECKLIST DE IMPLEMENTAÇÃO

### Para ativar o sistema de split:

- [ ] **1. Configurar variáveis de ambiente**
  - [ ] `RENUM_WALLET_ID` no Supabase

- [ ] **2. Corrigir estrutura do banco**
  - [ ] Adicionar coluna `asaas_wallet_id` em `affiliates`
  - [ ] Criar registros em `asaas_cobrancas` ao criar assinatura

- [ ] **3. Adicionar chamada no código**
  - [ ] Chamar `asaas-configure-split` após criar assinatura
  - [ ] Adicionar tratamento de erro
  - [ ] Adicionar logs de debug

- [ ] **4. Testar no sandbox**
  - [ ] Fazer filiação de teste
  - [ ] Verificar splits criados no banco
  - [ ] Simular pagamento
  - [ ] Verificar splits ativados

- [ ] **5. Validar em produção**
  - [ ] Configurar `RENUM_WALLET_ID` de produção
  - [ ] Testar com pagamento real
  - [ ] Monitorar logs do webhook
  - [ ] Verificar transferências no Asaas

---

## 🔟 RECOMENDAÇÕES

### Prioridade ALTA:

1. **Adicionar chamada para asaas-configure-split**
   - Sem isso, nenhum split será criado
   - Implementação simples (10 linhas de código)

2. **Configurar RENUM_WALLET_ID**
   - Necessário para split funcionar
   - Obter wallet ID da RENUM no Asaas

### Prioridade MÉDIA:

3. **Corrigir tabela affiliates**
   - Adicionar coluna `asaas_wallet_id`
   - Permitir splits para afiliados

4. **Criar registros em asaas_cobrancas**
   - Vincular splits às cobranças
   - Facilitar rastreamento

### Prioridade BAIXA:

5. **Adicionar dashboard de splits**
   - Visualizar splits criados
   - Monitorar transferências
   - Relatórios de comissões

---

## ✅ CONCLUSÃO

### Status Atual:
- ✅ Código de split implementado e funcional
- ✅ Edge Functions prontas para uso
- ✅ Webhook configurado para processar splits
- ❌ **Split NÃO está sendo criado durante filiação**
- ❌ **Nenhum split foi processado até agora**

### Por que não funcionou no sandbox:
1. Código não chama a função de criar split
2. Sem splits criados, webhook não tem o que processar
3. Variáveis de ambiente não configuradas

### Para ativar:
1. Adicionar 1 chamada de função no código (10 linhas)
2. Configurar 1 variável de ambiente
3. Corrigir estrutura do banco (opcional mas recomendado)

### Tempo estimado:
- Implementação: 30 minutos
- Testes: 1 hora
- **Total: 1h30min**

---

**Relatório gerado em:** 13/10/2025  
**Arquivos analisados:** 5  
**Scripts criados:** 1 (`verify_splits.py`)  
**Status:** ⚠️ SISTEMA IMPLEMENTADO MAS INATIVO
