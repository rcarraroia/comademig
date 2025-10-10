# 📋 Instruções para Completar Tarefas Pendentes

## ⚠️ Tarefas que Precisam ser Feitas Manualmente

Estas tarefas envolvem Edge Functions que já existem no Supabase ou precisam ser executadas no painel.

---

## 🔧 Tarefa 3.2 - Atualizar Edge Function `affiliates-management`

### 📍 Localização
A Edge Function já existe no Supabase. Você precisa atualizá-la para incluir dados de referrals e commissions.

### 📝 O que fazer:

#### Opção 1: Atualizar via Painel do Supabase (Mais Fácil)

1. **Acesse o painel do Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto COMADEMIG
   - Clique em **"Edge Functions"**
   - Encontre a função `affiliates-management`

2. **Edite a função:**
   - Clique na função `affiliates-management`
   - Clique em **"Edit"** ou **"View Code"**

3. **Adicione as seguintes modificações:**

```typescript
// No endpoint GET que busca dados do afiliado, adicione:

// ANTES (código atual):
const { data: affiliate, error } = await supabase
  .from('affiliates')
  .select('*')
  .eq('user_id', userId)
  .single()

// DEPOIS (código atualizado):
const { data: affiliate, error } = await supabase
  .from('affiliates')
  .select(`
    *,
    referrals:affiliate_referrals(
      id,
      referred_user_id,
      referral_code,
      status,
      conversion_date,
      conversion_value,
      created_at,
      referred_user:profiles!referred_user_id(
        id,
        nome_completo,
        email
      )
    ),
    commissions:affiliate_commissions(
      id,
      payment_id,
      amount,
      status,
      created_at
    )
  `)
  .eq('user_id', userId)
  .single()
```

4. **Adicione validação de Wallet ID:**

```typescript
// Adicione esta função de validação no início do arquivo:

function validateWalletId(walletId: string): boolean {
  // Wallet ID do Asaas tem formato específico
  // Exemplo: wal_000000000000
  const walletIdRegex = /^wal_[a-zA-Z0-9]{12,}$/
  return walletIdRegex.test(walletId)
}

// Use na validação dos dados:
if (walletId && !validateWalletId(walletId)) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Wallet ID inválido. Formato esperado: wal_XXXXXXXXXXXX' 
    }),
    { status: 400, headers: corsHeaders }
  )
}
```

5. **Melhore o tratamento de erros:**

```typescript
// Envolva as operações principais em try-catch:

try {
  // ... código existente ...
  
  if (error) {
    console.error('Database error:', error)
    throw new Error(error.message || 'Erro ao buscar dados do afiliado')
  }
  
  if (!affiliate) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Afiliado não encontrado' 
      }),
      { status: 404, headers: corsHeaders }
    )
  }
  
  // ... resto do código ...
  
} catch (error) {
  console.error('Error in affiliates-management:', error)
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor',
      details: Deno.env.get('ENVIRONMENT') === 'development' ? error.stack : undefined
    }),
    { status: 500, headers: corsHeaders }
  )
}
```

6. **Salve e faça Deploy:**
   - Clique em **"Save"** ou **"Deploy"**
   - Aguarde a confirmação de sucesso

#### Opção 2: Atualizar via CLI (Alternativa)

```bash
# 1. Navegue até a pasta da função
cd supabase/functions/affiliates-management

# 2. Edite o arquivo index.ts com as modificações acima

# 3. Faça deploy
supabase functions deploy affiliates-management
```

---

## 🔧 Tarefa 3.3 - Criar Função para Registrar Indicações

### ✅ Status Atual
A funcionalidade JÁ EXISTE no hook `useReferralCode.ts`, mas você pode querer criar uma Edge Function separada para maior controle.

### 📝 Opção 1: Usar o Hook Existente (Recomendado)

O hook `src/hooks/useReferralCode.ts` já tem a função `registerReferral` que:
- ✅ Valida código de indicação
- ✅ Salva em `affiliate_referrals`
- ✅ Vincula `referred_user_id`
- ✅ Define status como 'pending'

**Como usar:**

```typescript
import { useReferralCode } from '@/hooks/useReferralCode';

function MeuComponente() {
  const { registerReferral, referralCode, affiliateInfo } = useReferralCode();
  
  // Após criar o usuário:
  const handleUserCreated = async (userId: string) => {
    const result = await registerReferral(userId);
    
    if (result.success) {
      console.log('Indicação registrada:', result.message);
    }
  };
}
```

### 📝 Opção 2: Criar Edge Function Separada (Opcional)

Se você preferir ter uma Edge Function dedicada:

1. **Crie o arquivo:**

```bash
# Via CLI
supabase functions new register-referral
```

2. **Adicione o código:**

```typescript
// supabase/functions/register-referral/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterReferralRequest {
  referralCode: string
  referredUserId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { referralCode, referredUserId }: RegisterReferralRequest = await req.json()

    console.log('Registering referral:', { referralCode, referredUserId })

    // Validar dados obrigatórios
    if (!referralCode || !referredUserId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código de indicação e ID do usuário são obrigatórios' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Validar código de indicação e buscar afiliado
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, display_name, status')
      .eq('referral_code', referralCode)
      .single()

    if (affiliateError || !affiliate) {
      console.error('Affiliate not found:', affiliateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código de indicação inválido' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar se afiliado está ativo
    if (affiliate.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Afiliado não está ativo' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Verificar se usuário já foi indicado
    const { data: existingReferral } = await supabase
      .from('affiliate_referrals')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .single()

    if (existingReferral) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário já foi indicado por outro afiliado' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Criar registro de indicação
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: 'pending',
      })
      .select()
      .single()

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao registrar indicação: ' + referralError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Referral created successfully:', referral.id)

    // 5. Criar notificação para o afiliado
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: affiliate.id,
          type: 'nova_indicacao',
          title: 'Nova Indicação!',
          message: `Você indicou um novo usuário! A comissão será creditada após o primeiro pagamento.`,
          action_url: '/dashboard/afiliados',
        })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
      // Não falha o processo principal
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Indicação registrada com sucesso! Você foi indicado por ${affiliate.display_name}`,
        data: {
          referralId: referral.id,
          affiliateName: affiliate.display_name,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in register-referral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

3. **Faça deploy:**

```bash
supabase functions deploy register-referral
```

4. **Use no código:**

```typescript
// Chamar a Edge Function
const { data, error } = await supabase.functions.invoke('register-referral', {
  body: {
    referralCode: 'ABC123',
    referredUserId: 'user-uuid-here'
  }
})

if (data?.success) {
  console.log('Indicação registrada:', data.message)
}
```

---

## ✅ Checklist de Conclusão

Após completar as tarefas acima, marque:

- [ ] Tarefa 3.2 - Edge Function `affiliates-management` atualizada
  - [ ] Endpoint GET inclui referrals
  - [ ] Endpoint GET inclui commissions
  - [ ] Validação de Wallet ID implementada
  - [ ] Tratamento de erros melhorado
  - [ ] Deploy realizado com sucesso

- [ ] Tarefa 3.3 - Função de registro de indicações
  - [ ] Opção escolhida (Hook existente OU Edge Function nova)
  - [ ] Validação de código implementada
  - [ ] Vinculação de referred_user_id funcionando
  - [ ] Status 'pending' sendo definido corretamente
  - [ ] Testado com sucesso

---

## 🧪 Como Testar

### Testar Tarefa 3.2:

```bash
# Fazer requisição para buscar dados do afiliado
curl -X GET "https://[SEU_PROJECT_REF].supabase.co/functions/v1/affiliates-management?userId=[USER_ID]" \
  -H "Authorization: Bearer [SEU_ANON_KEY]"

# Resposta esperada deve incluir:
# - Dados do afiliado
# - Array de referrals
# - Array de commissions
```

### Testar Tarefa 3.3:

```typescript
// No console do navegador ou em um componente:
import { useReferralCode } from '@/hooks/useReferralCode';

const { registerReferral } = useReferralCode();

// Após criar usuário:
const result = await registerReferral('user-uuid-aqui');
console.log(result);

// Verificar no banco:
// SELECT * FROM affiliate_referrals WHERE referred_user_id = 'user-uuid-aqui';
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** das Edge Functions no painel do Supabase
2. **Verifique as políticas RLS** - podem estar bloqueando acesso
3. **Verifique as variáveis de ambiente** - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
4. **Teste as queries SQL** diretamente no SQL Editor do Supabase

---

## 🎯 Próximos Passos Após Completar

1. Marcar tarefas 3.2 e 3.3 como concluídas
2. Testar fluxo completo de indicação
3. Verificar se comissões estão sendo calculadas corretamente
4. Configurar variável `RENUM_WALLET_ID` se ainda não fez
5. Executar migrações SQL pendentes

**Boa sorte! 🚀**
