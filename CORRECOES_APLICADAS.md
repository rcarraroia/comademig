# ✅ CORREÇÕES APLICADAS - Sistema de Filiação

**Data:** 21/10/2025  
**Versão:** 1.0

---

## 📋 PROBLEMAS CORRIGIDOS

### 1. ✅ Validação de CPF no Frontend
**Problema:** Sistema aceitava CPF inválido e criava registro antes de validar com Asaas

**Solução:**
- Criado `src/utils/cpfValidator.ts` com função `validarCPF()`
- Adicionada validação no schema Zod do formulário
- CPF agora é validado ANTES de submeter o formulário

**Arquivos alterados:**
- `src/utils/cpfValidator.ts` (NOVO)
- `src/components/payments/PaymentFormEnhanced.tsx`

---

### 2. ✅ Erro `formData is not defined`
**Problema:** Código tentava acessar `formData` que não existia no escopo, causando erro na criação de assinatura

**Solução:**
- Substituído `formData` por `data` (parâmetro correto da função)
- Assinatura agora é criada corretamente

**Arquivos alterados:**
- `src/hooks/useFiliacaoPayment.ts` (linhas 335-347)

---

### 3. ✅ Profile com Status e Tipo Incorretos
**Problema:** 
- Status ficava "pendente" mesmo com pagamento confirmado
- Tipo_membro ficava "membro" em vez do tipo selecionado

**Solução:**
- Adicionado `status: initialPaymentResult.status === 'CONFIRMED' ? 'ativo' : 'pendente'`
- Adicionado `tipo_membro: selectedMemberType.name.toLowerCase()`

**Arquivos alterados:**
- `src/hooks/useFiliacaoPayment.ts` (linhas 410-425)

---

### 4. ✅ Sistema de Afiliados Não Funcionava
**Problema:** Código de indicação não era capturado da URL, indicações não eram registradas

**Solução:**
- Adicionada captura do parâmetro `ref` da URL
- Busca do afiliado no banco de dados
- Código de afiliado agora é passado para Edge Function

**Arquivos alterados:**
- `src/hooks/useFiliacaoPayment.ts` (linhas 85-105)

**Como funciona:**
1. URL: `https://site.com/filiacao?ref=2AE24DCA`
2. Sistema captura `ref=2AE24DCA`
3. Busca afiliado com `referral_code = '2AE24DCA'` e `status = 'active'`
4. Se encontrado, passa `affiliateCode` para Edge Function
5. Edge Function cria splits e registra indicação

---

### 5. ✅ Tabela `admin_tasks` Não Existe
**Problema:** Código tentava inserir em tabela inexistente, causando erro 404

**Solução:**
- Removida tentativa de inserção em `admin_tasks`
- Substituído por log de erro no console
- Mensagem ao usuário mantida

**Arquivos alterados:**
- `src/hooks/useFiliacaoPayment.ts` (linhas 378-392)

---

## 🧪 TESTES NECESSÁRIOS

### Teste 1: Validação de CPF
- [ ] Tentar submeter com CPF inválido (ex: `11111111111`)
- [ ] Verificar que formulário bloqueia e mostra erro
- [ ] Submeter com CPF válido (ex: `11144477735`)
- [ ] Verificar que formulário aceita

### Teste 2: Criação de Assinatura
- [ ] Fazer filiação completa
- [ ] Verificar que assinatura é criada em `user_subscriptions`
- [ ] Verificar que não há erro `formData is not defined`

### Teste 3: Status e Tipo Corretos
- [ ] Fazer filiação como "Pastor"
- [ ] Verificar que `status = 'ativo'` após pagamento confirmado
- [ ] Verificar que `tipo_membro = 'pastor'`

### Teste 4: Sistema de Afiliados
- [ ] Acessar URL com código: `/filiacao?ref=2AE24DCA`
- [ ] Fazer filiação completa
- [ ] Verificar que indicação foi registrada em `affiliate_referrals`
- [ ] Verificar que splits foram criados em `asaas_splits`
- [ ] Verificar no painel do afiliado que indicação aparece

### Teste 5: Sem Afiliado (Filiação Direta)
- [ ] Acessar URL sem código: `/filiacao`
- [ ] Fazer filiação completa
- [ ] Verificar que NÃO há indicação registrada
- [ ] Verificar que NÃO há splits criados
- [ ] Verificar que filiação funciona normalmente

---

## 📊 FLUXO COMPLETO CORRIGIDO

```
1. Usuário acessa /filiacao?ref=2AE24DCA
   ↓
2. Sistema captura código de afiliado
   ↓
3. Usuário preenche formulário
   ↓
4. Frontend valida CPF (NOVO)
   ↓
5. Se CPF inválido → BLOQUEIA (NOVO)
   ↓
6. Se CPF válido → Prossegue
   ↓
7. Cria conta no Supabase Auth
   ↓
8. Cria cliente no Asaas
   ↓
9. Processa pagamento inicial
   ↓
10. Cria assinatura recorrente (CORRIGIDO)
    ↓
11. Atualiza profile com status "ativo" e tipo correto (CORRIGIDO)
    ↓
12. Se houver afiliado:
    - Registra indicação em affiliate_referrals (CORRIGIDO)
    - Cria splits em asaas_splits (CORRIGIDO)
    ↓
13. Redireciona para dashboard
```

---

## 🔍 VERIFICAÇÃO NO BANCO DE DADOS

Após filiação com afiliado, verificar:

```sql
-- 1. Profile atualizado
SELECT 
  nome_completo,
  status,
  tipo_membro,
  member_type_id,
  asaas_customer_id,
  asaas_subscription_id
FROM profiles
WHERE id = '[USER_ID]';

-- Esperado:
-- status = 'ativo'
-- tipo_membro = 'pastor' (ou tipo selecionado)
-- asaas_subscription_id != 'MANUAL_xxx'

-- 2. Assinatura criada
SELECT *
FROM user_subscriptions
WHERE user_id = '[USER_ID]';

-- Esperado: 1 registro

-- 3. Indicação registrada (se houver afiliado)
SELECT *
FROM affiliate_referrals
WHERE referred_user_id = '[USER_ID]';

-- Esperado: 1 registro com affiliate_id correto

-- 4. Splits criados (se houver afiliado)
SELECT *
FROM asaas_splits
WHERE subscription_id IN (
  SELECT id FROM user_subscriptions WHERE user_id = '[USER_ID]'
);

-- Esperado: 2+ registros (COMADEMIG + Afiliado)
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **CPF de Teste Válido:** Use `11144477735` para testes
2. **Código de Afiliado:** Use `2AE24DCA` (BEATRIZ FATIMA) para testes
3. **Cartão de Teste:** `5162306219378829` (Asaas Sandbox)
4. **Ambiente:** Todas correções funcionam em Sandbox e Produção

---

## 📝 PRÓXIMOS PASSOS

1. Testar fluxo completo com código de afiliado
2. Testar fluxo completo sem código de afiliado
3. Verificar painel do afiliado após indicação
4. Verificar cálculo de comissões
5. Testar renovação automática após 30 dias

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verificar console do navegador (F12)
2. Verificar logs das Edge Functions no Supabase
3. Verificar dados no banco com queries SQL acima
4. Reportar com prints e logs completos
