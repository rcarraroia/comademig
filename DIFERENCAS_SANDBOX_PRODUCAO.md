# 🔄 DIFERENÇAS: Sandbox vs Produção (Asaas)

**Sistema**: COMADEMIG  
**Objetivo**: Entender as diferenças entre ambientes

---

## 📊 COMPARAÇÃO RÁPIDA

| Aspecto | Sandbox | Produção |
|---------|---------|----------|
| **API Key** | `$aact_hmlg_...` | `$aact_prod_...` |
| **Base URL** | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| **Cobranças** | Simuladas | **REAIS** 💰 |
| **Cartões** | Cartões de teste | Cartões reais |
| **Boletos** | Não geram cobrança real | Geram cobrança real |
| **PIX** | Simulado | Real |
| **Webhooks** | Podem ser localhost | **DEVEM** ser HTTPS público |
| **Splits** | Simulados | Reais (dinheiro transferido) |
| **Taxas Asaas** | Não cobradas | **Cobradas** (2,99% + R$ 0,49) |
| **Estornos** | Simulados | Reais (dinheiro devolvido) |
| **Chargebacks** | Simulados | Reais (prejuízo real) |

---

## 🔑 CREDENCIAIS

### Sandbox:
```bash
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY...
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_ENVIRONMENT=sandbox
```

### Produção:
```bash
ASAAS_API_KEY=$aact_prod_[SUA_CHAVE_AQUI]
ASAAS_BASE_URL=https://api.asaas.com/v3
ASAAS_ENVIRONMENT=production
```

---

## 💳 CARTÕES DE TESTE (SANDBOX)

### Cartões que APROVAM:
```
Número: 5162306219378829
CVV: 318
Validade: 12/2030
Nome: Qualquer nome
```

```
Número: 5184019740373151
CVV: 739
Validade: 12/2030
Nome: Qualquer nome
```

### Cartões que RECUSAM:
```
Número: 5105105105105100
CVV: 123
Validade: 12/2030
Motivo: Saldo insuficiente
```

```
Número: 4111111111111111
CVV: 123
Validade: 12/2030
Motivo: Cartão inválido
```

### ⚠️ PRODUÇÃO:
**Não existem cartões de teste!**  
Todos os cartões são reais e geram cobranças reais.

---

## 🔔 WEBHOOKS

### Sandbox:
- ✅ Pode usar localhost (com ngrok/tunneling)
- ✅ Pode usar HTTP (não recomendado)
- ✅ Token pode ser simples
- ✅ Eventos são simulados

**Exemplo:**
```
URL: http://localhost:3000/webhook
Token: test-token-123
```

### Produção:
- ❌ **NÃO** pode usar localhost
- ❌ **NÃO** pode usar HTTP
- ✅ **DEVE** usar HTTPS público
- ✅ Token **DEVE** ser forte (32+ caracteres)
- ✅ Eventos são reais

**Exemplo:**
```
URL: https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook
Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4
```

---

## 💰 VALORES E TAXAS

### Sandbox:
- ✅ Qualquer valor (R$ 0,01 a R$ 999.999,99)
- ✅ Sem taxas cobradas
- ✅ Sem limite de transações
- ✅ Sem validação de saldo

### Produção:
- ✅ Qualquer valor (R$ 0,01 a R$ 999.999,99)
- ❌ **Taxas cobradas** por transação:
  - Cartão de crédito: 2,99% + R$ 0,49
  - Boleto: R$ 3,49
  - PIX: R$ 0,99
- ❌ Limite de transações (conforme plano)
- ❌ Validação de saldo real

**Exemplo de cálculo:**
```
Cobrança: R$ 100,00
Taxa Asaas (cartão): R$ 3,48 (2,99% + R$ 0,49)
Você recebe: R$ 96,52
```

---

## 🔄 SPLITS (AFILIADOS)

### Sandbox:
- ✅ Splits simulados
- ✅ Não transfere dinheiro real
- ✅ Pode testar qualquer percentual
- ✅ Sem validação de wallet

### Produção:
- ❌ Splits **REAIS**
- ❌ **Transfere dinheiro real** para afiliados
- ❌ Wallet ID deve ser válido
- ❌ Afiliado deve ter conta Asaas ativa
- ❌ Taxas aplicadas sobre splits

**Exemplo:**
```
Cobrança: R$ 100,00
Split afiliado: 10% = R$ 10,00
Taxa Asaas: R$ 3,48
Você recebe: R$ 86,52
Afiliado recebe: R$ 10,00
```

---

## 📅 CICLO DE VIDA DE COBRANÇA

### Sandbox:
```
PENDING → CONFIRMED → RECEIVED (instantâneo)
```
- Transições são imediatas
- Pode forçar status via API
- Não depende de banco/operadora

### Produção:
```
PENDING → CONFIRMED → RECEIVED (pode levar dias)
```
- **Cartão**: Confirmação em minutos, recebimento em D+30
- **Boleto**: Confirmação em 1-3 dias úteis
- **PIX**: Confirmação instantânea
- Não pode forçar status
- Depende de banco/operadora

---

## 🚨 ERROS E VALIDAÇÕES

### Sandbox:
- ✅ Erros simulados
- ✅ Pode testar todos os cenários
- ✅ Sem consequências reais
- ✅ Retry ilimitado

### Produção:
- ❌ Erros **REAIS**
- ❌ Consequências reais:
  - Chargeback = prejuízo
  - Estorno = devolução de dinheiro
  - Falha = cliente insatisfeito
- ❌ Retry limitado (evitar duplicação)

---

## 🔐 SEGURANÇA

### Sandbox:
- ⚠️ Segurança relaxada
- ⚠️ Token pode ser simples
- ⚠️ Validações menos rígidas

### Produção:
- ✅ **Segurança CRÍTICA**
- ✅ Token forte obrigatório
- ✅ HTTPS obrigatório
- ✅ Validação de IP (recomendado)
- ✅ Rate limiting ativo
- ✅ Logs de auditoria

---

## 📊 MONITORAMENTO

### Sandbox:
- Logs básicos
- Sem alertas críticos
- Pode ignorar erros

### Produção:
- **Logs detalhados obrigatórios**
- **Alertas críticos configurados**
- **Monitoramento 24/7**
- **Métricas de negócio**:
  - Taxa de conversão
  - Taxa de chargeback
  - Tempo médio de confirmação
  - Valor médio de transação

---

## 🎯 QUANDO USAR CADA AMBIENTE

### Use Sandbox para:
- ✅ Desenvolvimento
- ✅ Testes de integração
- ✅ Testes de fluxo
- ✅ Demonstrações
- ✅ Treinamento de equipe
- ✅ Validação de lógica

### Use Produção para:
- ✅ Cobranças reais de clientes
- ✅ Transações financeiras reais
- ✅ Operação do negócio

### ❌ NUNCA use Produção para:
- ❌ Testes de desenvolvimento
- ❌ Experimentos
- ❌ Aprendizado
- ❌ Demonstrações

---

## 🔄 MIGRAÇÃO SEGURA

### Checklist antes de migrar:

**Técnico:**
- [ ] Todos os fluxos testados em sandbox
- [ ] Webhooks funcionando 100%
- [ ] Tratamento de erros implementado
- [ ] Logs configurados
- [ ] Monitoramento ativo

**Negócio:**
- [ ] Conta Asaas aprovada
- [ ] Taxas compreendidas
- [ ] Fluxo de caixa planejado
- [ ] Suporte preparado
- [ ] Clientes informados

**Segurança:**
- [ ] HTTPS configurado
- [ ] Tokens fortes gerados
- [ ] Secrets protegidos
- [ ] Backup de configurações
- [ ] Plano de rollback pronto

---

## ⚠️ ARMADILHAS COMUNS

### 1. Esquecer de mudar Base URL
```bash
# ❌ ERRADO (produção com URL sandbox)
ASAAS_API_KEY=$aact_prod_...
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3  # ❌

# ✅ CORRETO
ASAAS_API_KEY=$aact_prod_...
ASAAS_BASE_URL=https://api.asaas.com/v3  # ✅
```

### 2. Usar cartões de teste em produção
```bash
# ❌ Não funciona em produção
Cartão: 5162306219378829

# ✅ Use cartões reais
Cartão: [cartão real do cliente]
```

### 3. Webhook HTTP em produção
```bash
# ❌ Asaas rejeita HTTP em produção
URL: http://meusite.com/webhook

# ✅ Use HTTPS
URL: https://meusite.com/webhook
```

### 4. Token fraco
```bash
# ❌ Token fraco
ASAAS_WEBHOOK_TOKEN=123456

# ✅ Token forte (32+ caracteres)
ASAAS_WEBHOOK_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 📞 SUPORTE

**Sandbox:**
- Documentação: https://docs.asaas.com
- Fórum: https://forum.asaas.com

**Produção:**
- Suporte: suporte@asaas.com
- Telefone: (11) 4950-2915
- WhatsApp: (11) 97654-3210

---

## ✅ RESUMO

| Você quer... | Use... |
|--------------|--------|
| Testar integração | Sandbox |
| Desenvolver funcionalidade | Sandbox |
| Treinar equipe | Sandbox |
| Fazer demonstração | Sandbox |
| Cobrar clientes | **Produção** |
| Receber dinheiro real | **Produção** |

**Regra de ouro:** Se envolve dinheiro real, use produção. Caso contrário, use sandbox.

---

**Dúvidas? Consulte o guia completo:** `GUIA_MIGRACAO_SANDBOX_PARA_PRODUCAO.md`
