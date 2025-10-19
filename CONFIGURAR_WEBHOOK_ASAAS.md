# 🔐 CONFIGURAR WEBHOOK DO ASAAS - PASSO A PASSO

## 🎯 PROBLEMA IDENTIFICADO

**Webhook retornando 401 (Unauthorized):**
- Access Token não está configurado no Asaas
- Variável `ASAAS_WEBHOOK_TOKEN` não está configurada no Supabase
- Por isso os webhooks falham e a fila fica pausada

---

## ✅ SOLUÇÃO - 3 PASSOS

### PASSO 1: Gerar Token Seguro

**Use este token gerado:**
```
webhook_comademig_2025_a8f3k9m2p5x7q1w4
```

Ou gere um novo token seguro (recomendado):
- Mínimo 32 caracteres
- Mistura de letras, números e símbolos
- Exemplo: `whk_prod_comademig_2025_X9mK2pL5qW8nR3vT`

---

### PASSO 2: Configurar no Supabase

**2.1. Acessar Dashboard do Supabase:**
1. Ir para: https://supabase.com/dashboard/project/amkelczfwazutrciqtlk
2. Clicar em: **Settings** (engrenagem no menu lateral)
3. Clicar em: **Edge Functions**
4. Rolar até: **Secrets**

**2.2. Adicionar Secret:**
1. Clicar em: **Add new secret**
2. **Name:** `ASAAS_WEBHOOK_TOKEN`
3. **Value:** `webhook_comademig_2025_a8f3k9m2p5x7q1w4`
4. Clicar em: **Save**

**2.3. Verificar se foi salvo:**
- Deve aparecer na lista de secrets
- Valor ficará oculto (••••••••)

---

### PASSO 3: Configurar no Asaas

**3.1. Acessar Configuração de Webhook:**
1. Ir para: https://sandbox.asaas.com/integration
2. Clicar em: **Webhooks**
3. Clicar em: **Editar** no webhook existente

**3.2. Configurar Access Token:**
1. No campo **"Access Token"** (que está vazio)
2. Colar o mesmo token: `webhook_comademig_2025_a8f3k9m2p5x7q1w4`
3. **IMPORTANTE:** Deve ser EXATAMENTE o mesmo token do Supabase

**3.3. Verificar URL:**
- URL deve ser: `https://amkelczfwazutrciqtlk.supabase.co/functions/v1/asaas-webhook`
- Eventos: Manter todos marcados (já está correto)

**3.4. Salvar:**
1. Clicar em: **Salvar**
2. Aguardar confirmação

---

### PASSO 4: Reativar Fila de Webhooks Pausada

**4.1. Acessar Logs:**
1. Na mesma página de Webhooks
2. Clicar em: **Logs de Webhooks**

**4.2. Reativar Fila:**
1. Procurar mensagem: "Você possui (1) fila de Webhook pausada"
2. Clicar no link: **Logs de Webhooks**
3. Clicar em: **Reativar fila** ou **Remover da fila**

---

### PASSO 5: Testar Webhook

**5.1. Reenviar Webhook Falhado:**
1. Nos logs de webhooks
2. Encontrar um webhook com status 401
3. Clicar em: **Reenviar**
4. Verificar se agora retorna 200 (sucesso)

**5.2. Ou fazer novo pagamento:**
1. Criar nova solicitação de serviço
2. Simular pagamento no Asaas
3. Verificar se webhook é recebido com sucesso
4. Verificar se solicitação aparece no sistema

---

## 🔍 VERIFICAÇÃO

### Como saber se está funcionando:

**1. Webhook retorna 200 (não 401):**
- Nos logs do Asaas, status deve ser verde/sucesso
- Não deve aparecer "Unauthorized"

**2. Solicitação é criada:**
- Após confirmar pagamento
- Aparece no histórico do usuário
- Aparece no painel admin

**3. Notificações são enviadas:**
- Usuário recebe notificação
- Admins recebem notificação

---

## 📋 CHECKLIST COMPLETO

- [ ] Token gerado (32+ caracteres)
- [ ] Secret `ASAAS_WEBHOOK_TOKEN` criado no Supabase
- [ ] Access Token configurado no webhook do Asaas
- [ ] Tokens são EXATAMENTE iguais
- [ ] Webhook salvo no Asaas
- [ ] Fila de webhooks reativada
- [ ] Webhook testado (retorna 200)
- [ ] Nova solicitação testada
- [ ] Solicitação aparece no sistema

---

## ⚠️ IMPORTANTE

**O token deve ser EXATAMENTE o mesmo em ambos os lugares:**
- ✅ Supabase: `ASAAS_WEBHOOK_TOKEN` = `webhook_comademig_2025_a8f3k9m2p5x7q1w4`
- ✅ Asaas: Access Token = `webhook_comademig_2025_a8f3k9m2p5x7q1w4`

**Não pode ter:**
- ❌ Espaços extras
- ❌ Quebras de linha
- ❌ Caracteres invisíveis
- ❌ Diferenças de maiúsculas/minúsculas

---

## 🎉 RESULTADO ESPERADO

Após configuração correta:

1. **Webhooks funcionam** (status 200)
2. **Solicitações são criadas automaticamente** após pagamento
3. **Histórico do usuário funciona**
4. **Painel admin funciona**
5. **Notificações são enviadas**

---

## 🆘 SE AINDA NÃO FUNCIONAR

**Verificar:**
1. Token está correto em ambos os lugares
2. Fila de webhooks foi reativada
3. Edge Function foi deployada (última versão)
4. Aguardar alguns minutos (cache)

**Testar manualmente:**
1. Criar nova solicitação
2. Pagar no Asaas
3. Verificar logs do webhook
4. Se retornar 200, verificar banco de dados

---

## 📞 PRÓXIMOS PASSOS

1. **Configure o token agora** (5 minutos)
2. **Reative a fila de webhooks**
3. **Teste com nova solicitação**
4. **Me avise o resultado**

**Token sugerido para usar:**
```
webhook_comademig_2025_a8f3k9m2p5x7q1w4
```

Ou gere um novo se preferir!
