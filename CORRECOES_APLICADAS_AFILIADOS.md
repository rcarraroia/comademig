# ✅ CORREÇÕES APLICADAS - SISTEMA DE AFILIADOS

**Data:** 2025-10-21  
**Arquivo:** `src/hooks/useFiliacaoPayment.ts`  
**Status:** ✅ CONCLUÍDO

---

## 🐛 BUGS CORRIGIDOS

### BUG #1: Redefinição de variável `affiliateInfo`
**Linha:** 98  
**Problema:** Sobrescrevia dados validados  
**Solução:** Criada variável separada `validatedAffiliateInfo`

**ANTES:**
```typescript
let affiliateInfo: { affiliateId: string } | null = null;
```

**DEPOIS:**
```typescript
let validatedAffiliateInfo: { affiliateId: string; referralCode: string } | null = null;
```

---

### BUG #2: Busca duplicada da URL
**Linha:** 96-113  
**Problema:** Buscava código da URL novamente, ignorando validação  
**Solução:** Usa dados já validados pelo `useReferralCode`

**ANTES:**
```typescript
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');
```

**DEPOIS:**
```typescript
if (affiliateInfo?.referralCode && affiliateInfo?.affiliateInfo?.id) {
  validatedAffiliateInfo = {
    affiliateId: affiliateInfo.affiliateInfo.id,
    referralCode: affiliateInfo.referralCode
  };
  console.log('✅ Usando afiliado já validado');
}
```

---

### BUG #3: Registro de indicação não funcionava
**Linha:** 134-145  
**Problema:** Tentava chamar método inexistente  
**Solução:** Insert direto na tabela `affiliate_referrals`

**ANTES:**
```typescript
if (affiliateInfo?.registerReferral) {
  const result = await affiliateInfo.registerReferral(currentUserId);
}
```

**DEPOIS:**
```typescript
if (validatedAffiliateInfo) {
  await supabase
    .from('affiliate_referrals')
    .insert({
      affiliate_id: validatedAffiliateInfo.affiliateId,
      referral_code: validatedAffiliateInfo.referralCode,
      referred_user_id: currentUserId,
      status: 'pending'
    });
  console.log('✅ Indicação registrada!');
}
```

---

### BUG #4: Código não passado para Edge Function
**Linha:** 330  
**Problema:** Passava `referralCode` que era null  
**Solução:** Passa `validatedAffiliateInfo.referralCode`

**ANTES:**
```typescript
affiliateCode: referralCode || null,
```

**DEPOIS:**
```typescript
affiliateCode: validatedAffiliateInfo?.referralCode || null,
```

---

### BUG #5: Registro duplicado removido
**Linha:** 467-481  
**Problema:** Tentava registrar novamente (nunca funcionava)  
**Solução:** Removido (já registra na linha 145)

**ANTES:**
```typescript
if (affiliateInfo?.affiliateId && affiliateInfo?.referralCode) {
  await supabase.from('affiliate_referrals').insert([...]);
}
```

**DEPOIS:**
```typescript
// Indicação já foi registrada após criar conta
console.log('ℹ️ Indicação já registrada anteriormente');
```

---

## 🎯 FLUXO CORRIGIDO

### 1. Usuário acessa link
```
http://localhost:8080/filiacao?ref=2AE24DCA
```

### 2. Hook `useReferralCode` valida
```
✅ Código capturado: 2AE24DCA
✅ Salvo no localStorage
✅ Validado no banco
✅ Afiliado encontrado
```

### 3. Dados passados via props
```
affiliateInfo = {
  referralCode: "2AE24DCA",
  affiliateInfo: { id: "xxx", display_name: "João Silva" },
  hasReferral: true
}
```

### 4. Hook `useFiliacaoPayment` usa dados validados
```
✅ validatedAffiliateInfo criado
✅ Não busca da URL novamente
✅ Usa dados já validados
```

### 5. Conta criada
```
✅ user_id = yyy
```

### 6. Indicação registrada
```
✅ INSERT em affiliate_referrals
   - affiliate_id: xxx
   - referral_code: 2AE24DCA
   - referred_user_id: yyy
   - status: pending
```

### 7. Assinatura criada
```
✅ Edge Function recebe affiliateCode: "2AE24DCA"
✅ Configura splits:
   - COMADEMIG: 40%
   - RENUM: 40%
   - Afiliado: 20%
```

---

## 🧪 COMO TESTAR

### 1. Obter código de afiliado válido
```sql
SELECT referral_code, display_name, status 
FROM affiliates 
WHERE status = 'active' 
LIMIT 1;
```

### 2. Acessar link com código
```
http://localhost:8080/filiacao?ref=CODIGO_OBTIDO
```

### 3. Preencher formulário
- Nome completo
- CPF
- Email
- Telefone
- Endereço
- Tipo de membro: **Diácono**
- Dados do cartão

### 4. Submeter e verificar logs
```
Console do navegador:
✅ Código de indicação válido
✅ Afiliado encontrado
✅ Usando afiliado já validado
✅ Indicação registrada!
```

### 5. Verificar banco de dados
```sql
-- Verificar indicação registrada
SELECT * FROM affiliate_referrals 
WHERE referral_code = 'CODIGO_USADO'
ORDER BY created_at DESC 
LIMIT 1;

-- Verificar assinatura com código
SELECT * FROM asaas_subscriptions 
WHERE affiliate_code = 'CODIGO_USADO'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ RESULTADO ESPERADO

### Tabela `affiliate_referrals`
```
affiliate_id: xxx (ID do afiliado)
referral_code: 2AE24DCA
referred_user_id: yyy (ID do novo usuário)
status: pending
created_at: 2025-10-21 ...
```

### Tabela `asaas_subscriptions`
```
user_id: yyy
affiliate_code: 2AE24DCA
status: ACTIVE
```

### Splits no Asaas
```
Configuração: Filiação
- COMADEMIG: 40%
- RENUM: 40%
- Afiliado (João Silva): 20%
```

### Quando primeiro pagamento for confirmado
```sql
UPDATE affiliate_referrals 
SET status = 'confirmed',
    confirmed_at = NOW()
WHERE referred_user_id = 'yyy';
```

---

## 📝 ARQUIVOS MODIFICADOS

1. ✅ `src/hooks/useFiliacaoPayment.ts`
   - Linha 96-113: Correção de busca de código
   - Linha 134-145: Correção de registro de indicação
   - Linha 330: Correção de passagem de código para Edge Function
   - Linha 467-481: Remoção de código duplicado

---

## 🎉 SISTEMA PRONTO PARA TESTE!

**Todas as correções foram aplicadas com sucesso.**

**Próximo passo:** Testar fluxo completo com código de indicação real.
