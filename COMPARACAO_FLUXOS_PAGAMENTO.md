# 🔍 COMPARAÇÃO: Filiação (✅ Funciona) vs Serviços (❌ Erro)

**Data:** 13/10/2025

---

## 📊 ESTRUTURA DE DADOS ENVIADA

### ✅ FILIAÇÃO (Funcionando)

#### Hook Usado: `useAsaasPixPayments.ts` / `useAsaasCardPayments.ts`

**Estrutura PIX:**
```json
{
  "customer_id": "cus_000007107259",
  "user_id": "324b8066-1be9-425b-8384-942134e012f7",
  "service_type": "filiacao",
  "service_data": {
    "type": "filiacao",
    "details": {
      // Dados específicos da filiação
    }
  },
  "payment_data": {
    "value": 100.00,
    "dueDate": "2025-10-14",
    "description": "Filiação COMADEMIG",
    "externalReference": "..."
  }
}
```

**Estrutura Cartão:**
```json
{
  "customer_id": "cus_000007107259",
  "user_id": "324b8066-1be9-425b-8384-942134e012f7",
  "service_type": "filiacao",
  "service_data": {
    "type": "filiacao",
    "details": {
      // Dados específicos
    }
  },
  "payment_data": {
    "value": 100.00,
    "dueDate": "2025-10-14",
    "description": "Filiação COMADEMIG",
    "installmentCount": 1
  },
  "credit_card": {
    "holderName": "NOME COMPLETO",
    "number": "5162306219378829",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "ccv": "123"
  },
  "credit_card_holder_info": {
    "name": "Nome Completo",
    "email": "email@example.com",
    "cpfCnpj": "12345678909",
    "postalCode": "35164015",
    "addressNumber": "40",
    "addressComplement": "Bloco A - Apto: 401",
    "phone": "33998384177"
  }
}
```

---

### ❌ SERVIÇOS (Com Erro)

#### Hook Usado: `useCheckoutTransparente.ts`

**Estrutura PIX:**
```json
{
  "customer_id": "cus_000007107259",
  "service_type": "certidao",
  "service_data": {
    "servico_id": "...",
    "servico_nome": "Certidão teste",
    "dados_formulario": {...},
    "user_id": "324b8066-1be9-425b-8384-942134e012f7",
    "customer_id": "cus_000007107259"
  },
  "payment_data": {
    "value": 4.75,
    "dueDate": "2025-10-14",
    "description": "Solicitação de Certidão teste"
  },
  "user_id": "324b8066-1be9-425b-8384-942134e012f7"
}
```

**Estrutura Cartão:**
```json
{
  "customer_id": "cus_000007107259",
  "service_type": "certidao",
  "service_data": {
    "servico_id": "...",
    "servico_nome": "Certidão teste",
    "dados_formulario": {...},
    "user_id": "324b8066-1be9-425b-8384-942134e012f7",
    "customer_id": "cus_000007107259"
  },
  "payment_data": {
    "value": 5.00,
    "dueDate": "2025-10-14",
    "description": "Solicitação de Certidão teste",
    "installmentCount": 1
  },
  "credit_card": {
    "holderName": "RENATO TESTE",
    "number": "5162306219378829",
    "expiryMonth": "12",
    "expiryYear": "2028",
    "ccv": "123"
  },
  "credit_card_holder_info": {
    "name": "renato teste",
    "email": "rcnaturopata@gmail.com",
    "cpfCnpj": "12345678909",
    "postalCode": "00000000",  // ❌ PROBLEMA
    "addressNumber": "0",       // ❌ PROBLEMA
    "phone": "33998384177"
  }
}
```

---

## 🔍 DIFERENÇAS IDENTIFICADAS

### 1. ❌ Estrutura de `service_data` Diferente

**Filiação (✅):**
```json
"service_data": {
  "type": "filiacao",
  "details": {...}
}
```

**Serviços (❌):**
```json
"service_data": {
  "servico_id": "...",
  "servico_nome": "...",
  "dados_formulario": {...},
  "user_id": "...",
  "customer_id": "..."
}
```

**Problema:** Edge Function espera `service_data.type` e `service_data.details`, mas recebe estrutura diferente.

---

### 2. ❌ Dados Hardcoded Inválidos (Cartão)

**Filiação (✅):**
```json
"credit_card_holder_info": {
  "postalCode": "35164015",  // ✅ CEP real
  "addressNumber": "40",     // ✅ Número real
  "addressComplement": "Bloco A - Apto: 401"
}
```

**Serviços (❌):**
```json
"credit_card_holder_info": {
  "postalCode": "00000000",  // ❌ CEP inválido
  "addressNumber": "0",      // ❌ Número inválido
  "addressComplement": undefined
}
```

**Problema:** Código hardcoded em `useCheckoutTransparente.ts` linha ~165:
```typescript
creditCardHolderInfo: {
  name: data.cliente.nome,
  email: data.cliente.email,
  cpfCnpj: data.cliente.cpf,
  postalCode: '00000000',  // ❌ HARDCODED
  addressNumber: '0',       // ❌ HARDCODED
  phone: data.cliente.telefone,
}
```

---

### 3. ❌ Falta de Campos de Endereço no Formulário

**Filiação:** Coleta endereço completo no formulário  
**Serviços:** Não coleta endereço, apenas nome, CPF, email, telefone

**Campos Faltando:**
- CEP (`postalCode`)
- Endereço (`address`)
- Número (`addressNumber`)
- Complemento (`addressComplement`)
- Cidade (`city`)
- Estado (`state`)

---

## 🎯 CAUSA RAIZ DOS ERROS

### Erro 500 em PIX:
**Causa:** Edge Function `asaas-create-pix-payment` espera:
```typescript
service_data: {
  type: ServiceType,
  details: Record<string, any>
}
```

Mas recebe:
```typescript
service_data: {
  servico_id: string,
  servico_nome: string,
  dados_formulario: {...},
  user_id: string,
  customer_id: string
}
```

**Resultado:** Edge Function não consegue processar e retorna erro 500.

---

### Erro 400 em Cartão:
**Causa:** Validação da Edge Function `asaas-process-card` rejeita:
```typescript
if (holderInfo.postalCode.replace(/\D/g, '').length !== 8) {
  errors.push('CEP deve ter 8 dígitos');
}
```

**Dados enviados:** `postalCode: "00000000"` (tecnicamente 8 dígitos, mas inválido)

**Validação do Asaas:** Rejeita CEP `00000000` como inválido.

**Resultado:** Edge Function retorna erro 400 com mensagem de validação.

---

## ✅ SOLUÇÕES NECESSÁRIAS

### Solução 1: Padronizar Estrutura de `service_data`

**Arquivo:** `src/hooks/useCheckoutTransparente.ts`

**Alterar de:**
```typescript
service_data: {
  servico_id: data.servico_id,
  servico_nome: data.servico_nome,
  dados_formulario: data.dados_formulario,
  user_id: user.id,
  customer_id: customerId,
}
```

**Para:**
```typescript
service_data: {
  type: data.servico_id,  // ou 'certidao', 'regularizacao'
  details: {
    servico_id: data.servico_id,
    servico_nome: data.servico_nome,
    dados_formulario: data.dados_formulario,
    user_id: user.id,
    customer_id: customerId,
  }
}
```

---

### Solução 2: Adicionar Campos de Endereço no Formulário

**Arquivo:** `src/pages/dashboard/CheckoutServico.tsx`

**Adicionar campos:**
```typescript
const [dadosCliente, setDadosCliente] = useState({
  nome: user?.user_metadata?.full_name || '',
  cpf: '',
  email: user?.email || '',
  telefone: '',
  // ✅ NOVOS CAMPOS
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  cidade: '',
  estado: '',
});
```

**Adicionar inputs no formulário:**
```tsx
<div className="space-y-2">
  <Label htmlFor="cep">CEP *</Label>
  <Input
    id="cep"
    value={dadosCliente.cep}
    onChange={(e) => setDadosCliente({ ...dadosCliente, cep: e.target.value })}
    placeholder="00000-000"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="endereco">Endereço *</Label>
  <Input
    id="endereco"
    value={dadosCliente.endereco}
    onChange={(e) => setDadosCliente({ ...dadosCliente, endereco: e.target.value })}
    placeholder="Rua, Avenida, etc"
  />
</div>

<div className="grid gap-4 md:grid-cols-3">
  <div className="space-y-2">
    <Label htmlFor="numero">Número *</Label>
    <Input
      id="numero"
      value={dadosCliente.numero}
      onChange={(e) => setDadosCliente({ ...dadosCliente, numero: e.target.value })}
      placeholder="123"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="complemento">Complemento</Label>
    <Input
      id="complemento"
      value={dadosCliente.complemento}
      onChange={(e) => setDadosCliente({ ...dadosCliente, complemento: e.target.value })}
      placeholder="Apto, Bloco, etc"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="cidade">Cidade *</Label>
    <Input
      id="cidade"
      value={dadosCliente.cidade}
      onChange={(e) => setDadosCliente({ ...dadosCliente, cidade: e.target.value })}
      placeholder="Sua cidade"
    />
  </div>
</div>

<div className="space-y-2">
  <Label htmlFor="estado">Estado *</Label>
  <Input
    id="estado"
    value={dadosCliente.estado}
    onChange={(e) => setDadosCliente({ ...dadosCliente, estado: e.target.value })}
    placeholder="MG"
    maxLength={2}
  />
</div>
```

---

### Solução 3: Remover Dados Hardcoded

**Arquivo:** `src/hooks/useCheckoutTransparente.ts`

**Alterar de:**
```typescript
creditCardHolderInfo: {
  name: data.cliente.nome,
  email: data.cliente.email,
  cpfCnpj: data.cliente.cpf,
  postalCode: '00000000',  // ❌ HARDCODED
  addressNumber: '0',       // ❌ HARDCODED
  phone: data.cliente.telefone,
}
```

**Para:**
```typescript
creditCardHolderInfo: {
  name: data.cliente.nome,
  email: data.cliente.email,
  cpfCnpj: data.cliente.cpf,
  postalCode: data.cliente.cep,           // ✅ Do formulário
  addressNumber: data.cliente.numero,     // ✅ Do formulário
  addressComplement: data.cliente.complemento,  // ✅ Do formulário
  phone: data.cliente.telefone,
}
```

---

### Solução 4: Preencher Automaticamente do Perfil

**Criar hook:** `src/hooks/useProfile.ts`

```typescript
export const useProfile = () => {
  const { user } = useAuth();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  return { profile, isLoading };
};
```

**Usar no formulário:**
```typescript
const { profile } = useProfile();

useEffect(() => {
  if (profile) {
    setDadosCliente({
      nome: profile.full_name || '',
      cpf: profile.cpf || '',
      email: profile.email || user?.email || '',
      telefone: profile.phone || '',
      cep: profile.postal_code || '',
      endereco: profile.address || '',
      numero: profile.address_number || '',
      complemento: profile.address_complement || '',
      cidade: profile.city || '',
      estado: profile.state || '',
    });
  }
}, [profile]);
```

---

## 📋 CHECKLIST DE CORREÇÕES

### Prioridade CRÍTICA (Bloqueia Pagamentos):
- [ ] Padronizar estrutura de `service_data` em `useCheckoutTransparente.ts`
- [ ] Adicionar campos de endereço no formulário `CheckoutServico.tsx`
- [ ] Remover dados hardcoded de `useCheckoutTransparente.ts`
- [ ] Passar dados reais do formulário para Edge Functions

### Prioridade ALTA (Melhora UX):
- [ ] Criar hook `useProfile` para buscar dados do perfil
- [ ] Implementar preenchimento automático do formulário
- [ ] Adicionar validação de CEP (buscar endereço via ViaCEP)
- [ ] Salvar dados atualizados no perfil após checkout

### Prioridade MÉDIA (Melhorias):
- [ ] Corrigir query de `user_subscriptions` (erro 400 repetido)
- [ ] Adicionar loading states durante preenchimento automático
- [ ] Implementar máscara de CEP, CPF, telefone
- [ ] Adicionar validação de campos obrigatórios

---

## 🎯 RESUMO

**Problema Principal:** `useCheckoutTransparente` envia dados em formato diferente do esperado pelas Edge Functions.

**Solução:** Padronizar estrutura de dados para seguir o mesmo padrão de `useAsaasPixPayments` e `useAsaasCardPayments`.

**Impacto:** Após correções, checkout de serviços funcionará igual ao de filiação.

---

**Aguardando autorização para implementar correções.**
