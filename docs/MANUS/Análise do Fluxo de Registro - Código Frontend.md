# Análise do Fluxo de Registro - Código Frontend

## Páginas Principais

### 1. `/src/pages/Auth.tsx` - Página de Login
- Usa `useAuth()` context para autenticação
- Usa `useAuthActions()` hook para signIn
- Após login bem-sucedido, aguarda `user` E `profile` estarem disponíveis
- Redireciona baseado em `profile.tipo_membro`:
  - `admin` ou `super_admin` → `/admin/users`
  - Outros → `/dashboard`

### 2. `/src/pages/Filiacao.tsx` - Página de Registro
- Permite registro com ou sem estar logado
- Suporta código de referral de afiliado via query param `?ref=`
- Usa `MemberTypeSelector` para escolher tipo de membro
- Usa `PaymentFormEnhanced` para processar pagamento e registro

**Fluxo:**
1. Usuário seleciona tipo de membro
2. Clica em "Prosseguir com a Filiação"
3. Se já logado: aviso que filiação será vinculada à conta existente
4. Se não logado: aviso que nova conta será criada
5. Preenche formulário de pagamento
6. Processa filiação + pagamento

### 3. `/src/components/payments/PaymentFormEnhanced.tsx` - Formulário de Pagamento

**Campos do Formulário:**
- **Dados Pessoais**: nome_completo, cpf, telefone, email
- **Endereço**: cep, endereco, numero, complemento, bairro, cidade, estado
- **Igreja**: igreja, cargo_igreja, tempo_ministerio
- **Método de Pagamento**: pix ou credit_card
- **Dados do Cartão** (se credit_card): card_holder_name, card_number, card_expiry_month, card_expiry_year, card_ccv, card_installments
- **Senha**: password, password_confirmation (para criar conta)
- **Termos**: accept_terms, accept_privacy

**Validações:**
- CPF: 11 dígitos
- Telefone: mínimo 10 dígitos
- Email: formato válido
- CEP: 8 dígitos
- Senha: mínimo 6 caracteres, 1 maiúscula, 1 número
- Senhas devem conferir
- Termos devem ser aceitos

**Desconto PIX:**
- 5% de desconto se método = pix
- Calculado sobre o valor original do plano

## Hook useFiliacaoPayment

**Localização:** `/src/hooks/useFiliacaoPayment.ts`

**Fluxo de Processamento:**

### 1. Criação de Conta (se não logado)
```typescript
if (!currentUserId && data.password) {
  // Criar conta no Supabase Auth
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.nome_completo }
    }
  });
  
  currentUserId = authData.user.id;
  isNewAccount = true;
}
```

**Tratamento de Erro:**
- Se email já registrado → erro específico pedindo para fazer login

### 2. Verificação de Filiação Existente (se já logado)
```typescript
if (currentUserId) {
  // Verificar se já tem filiação ativa
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('id, status')
    .eq('user_id', currentUserId)
    .in('status', ['active', 'pending'])
    .single();
    
  if (existingSubscription) {
    throw new Error('Você já possui uma filiação ativa');
  }
}
```

### 3. Criar Cliente no Asaas
```typescript
const customerData = {
  name: data.nome_completo,
  email: data.email,
  phone: data.telefone,
  cpfCnpj: data.cpf,
  postalCode: data.cep,
  address: data.endereco,
  addressNumber: data.numero,
  complement: data.complemento || undefined,
  province: data.bairro,
  city: data.cidade,
  state: data.estado,
};

// ⚠️ IMPORTANTE: Passa currentUserId explicitamente
const customerResponse = await createCustomer(customerData, currentUserId);
```

### 4. Criar Assinatura no Asaas
```typescript
// Mapear billingType
let billingType: 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
if (data.payment_method === 'boleto') billingType = 'BOLETO';
else if (data.payment_method === 'credit_card') billingType = 'CREDIT_CARD';

// Mapear cycle baseado na recorrência
let cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
// ... lógica de mapeamento
```

## Estados do Pagamento

```typescript
type PaymentStatus = 
  | 'idle' 
  | 'creating_account' 
  | 'creating_customer' 
  | 'creating_subscription' 
  | 'updating_profile' 
  | 'completed';
```

## Hooks Utilizados

1. **useAuth()** - Contexto de autenticação
2. **useAsaasCustomers()** - Gerenciar clientes Asaas
3. **useAsaasSubscriptions()** - Gerenciar assinaturas Asaas
4. **useFiliacaoPayment()** - Orquestrar todo o fluxo

## Pontos de Atenção Identificados

### ✅ Boas Práticas
- Validação robusta de formulário com Zod
- Limpeza de formatação antes de enviar (CPF, telefone, CEP)
- Tratamento de erro específico para email já registrado
- Verificação de filiação existente antes de criar nova
- Logs detalhados para debug

### ⚠️ Pontos Críticos para Investigar
1. **Integração com Asaas**: Verificar se `createCustomer` e `createSubscription` estão funcionando
2. **Split de Pagamentos**: Não vi configuração de split no fluxo
3. **Programa de Afiliados**: `affiliateInfo` é capturado mas não vi processamento
4. **Atualização de Profile**: Status `updating_profile` existe mas não vi o código completo
5. **Webhook do Asaas**: Não vi configuração de webhook para receber eventos
6. **Banco de Dados**: Precisa verificar se tabelas e RLS estão corretos

## Próximos Passos da Análise
- [ ] Verificar hooks `useAsaasCustomers` e `useAsaasSubscriptions`
- [ ] Verificar Edge Functions do Supabase relacionadas ao Asaas
- [ ] Verificar estrutura do banco de dados (tabelas, RLS, triggers)
- [ ] Verificar configuração de webhooks
- [ ] Verificar integração com split de pagamentos
- [ ] Verificar programa de afiliados

