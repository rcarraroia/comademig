# Design Document - Módulo Unificado de Solicitação de Serviços

## Overview

Este documento descreve a arquitetura técnica, componentes, modelos de dados e fluxos do novo Módulo Unificado de Solicitação de Serviços da COMADEMIG.

### Objetivos Técnicos

1. **Unificação** - Consolidar certidões e regularização em um único módulo
2. **Escalabilidade** - Permitir adição de novos tipos de serviços facilmente
3. **Checkout Transparente** - Processar pagamentos sem sair do site
4. **Gestão Centralizada** - Admin controla tudo em um único painel
5. **Segurança** - RLS policies robustas e auditoria completa

### Tecnologias Utilizadas

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Radix UI + Tailwind CSS
- **Estado:** TanStack Query (React Query) v5
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Pagamentos:** Asaas API (PIX + Cartão de Crédito)
- **Validação:** Zod + React Hook Form

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │ Painel Admin │         │ Painel User  │                │
│  │              │         │              │                │
│  │ - Gestão     │         │ - Solicitar  │                │
│  │   Serviços   │         │   Serviços   │                │
│  │ - Gestão     │         │ - Histórico  │                │
│  │   Solicit.   │         │ - Checkout   │                │
│  └──────┬───────┘         └──────┬───────┘                │
│         │                        │                         │
│         └────────┬───────────────┘                         │
│                  │                                         │
│         ┌────────▼────────┐                                │
│         │  Custom Hooks   │                                │
│         │  - useServicos  │                                │
│         │  - useSolicita  │                                │
│         │  - useCheckout  │                                │
│         └────────┬────────┘                                │
└──────────────────┼─────────────────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │   Supabase Client  │
         └─────────┬──────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│                  SUPABASE (Backend)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │ Edge Funcs   │  │   Storage    │    │
│  │              │  │              │  │              │    │
│  │ - servicos   │  │ - webhook    │  │ - uploads    │    │
│  │ - solicita   │  │   asaas      │  │ - docs       │    │
│  │ - exigencias │  │              │  │              │    │
│  └──────────────┘  └──────┬───────┘  └──────────────┘    │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Asaas API     │
                    │                 │
                    │ - PIX           │
                    │ - Cartão        │
                    │ - Webhook       │
                    └─────────────────┘
```

### Component Architecture

```
src/
├── pages/
│   ├── admin/
│   │   ├── ServicosAdmin.tsx          # Gestão de serviços
│   │   └── SolicitacoesAdmin.tsx      # Gestão de solicitações
│   └── dashboard/
│       ├── SolicitacaoServicos.tsx    # Menu unificado usuário
│       └── CheckoutServico.tsx        # Checkout transparente
│
├── components/
│   ├── servicos/
│   │   ├── ServicoCard.tsx            # Card de serviço
│   │   ├── ServicoForm.tsx            # Formulário dinâmico
│   │   ├── ServicosList.tsx           # Lista de serviços
│   │   └── ServicoExigencias.tsx      # Config exigências
│   │
│   ├── solicitacoes/
│   │   ├── SolicitacaoCard.tsx        # Card de solicitação
│   │   ├── SolicitacaoDetalhes.tsx    # Detalhes completos
│   │   ├── SolicitacaoStatus.tsx      # Badge de status
│   │   └── SolicitacaoTimeline.tsx    # Histórico de status
│   │
│   └── checkout/
│       ├── CheckoutForm.tsx           # Formulário principal
│       ├── PaymentMethodSelector.tsx  # Seletor PIX/Cartão
│       ├── CardPaymentForm.tsx        # Campos do cartão
│       └── PixPaymentDisplay.tsx      # QR Code PIX
│
└── hooks/
    ├── useServicos.ts                 # CRUD serviços
    ├── useSolicitacoes.ts             # CRUD solicitações
    ├── useCheckoutTransparente.ts     # Checkout unificado
    └── useWebhookAsaas.ts             # Handler webhook
```

---

## Data Models

### Database Schema

#### Tabela: `servicos`

```sql
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('certidao', 'regularizacao', 'outro')),
  prazo TEXT,
  valor NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  aceita_pix BOOLEAN DEFAULT true,
  aceita_cartao BOOLEAN DEFAULT true,
  max_parcelas INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_servicos_categoria ON servicos(categoria);
CREATE INDEX idx_servicos_active ON servicos(is_active);
CREATE INDEX idx_servicos_sort ON servicos(categoria, sort_order);
```

#### Tabela: `servico_exigencias`

```sql
CREATE TABLE servico_exigencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('documento', 'campo_texto', 'campo_numero', 'campo_data', 'campo_select')),
  nome TEXT NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  opcoes JSONB, -- Para campos select: ["opcao1", "opcao2"]
  validacao JSONB, -- Regras de validação: {"min": 10, "max": 100}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exigencias_servico ON servico_exigencias(servico_id);
```

#### Tabela: `solicitacoes_servicos`

```sql
CREATE TABLE solicitacoes_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  servico_id UUID NOT NULL REFERENCES servicos(id),
  numero_protocolo TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'em_analise', 'aprovada', 'rejeitada', 'entregue')),
  valor_total NUMERIC(10,2) NOT NULL,
  payment_reference TEXT, -- ID da cobrança Asaas
  dados_enviados JSONB NOT NULL, -- Formulário preenchido
  observacoes_usuario TEXT,
  observacoes_admin TEXT,
  arquivo_entrega TEXT, -- URL do arquivo
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_aprovacao TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_solicitacoes_user ON solicitacoes_servicos(user_id);
CREATE INDEX idx_solicitacoes_servico ON solicitacoes_servicos(servico_id);
CREATE INDEX idx_solicitacoes_status ON solicitacoes_servicos(status);
CREATE INDEX idx_solicitacoes_protocolo ON solicitacoes_servicos(numero_protocolo);
CREATE INDEX idx_solicitacoes_payment ON solicitacoes_servicos(payment_reference);
```

### TypeScript Interfaces

```typescript
// Serviço
interface Servico {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'certidao' | 'regularizacao' | 'outro';
  prazo: string;
  valor: number;
  is_active: boolean;
  sort_order: number;
  aceita_pix: boolean;
  aceita_cartao: boolean;
  max_parcelas: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  exigencias?: ServicoExigencia[];
}

// Exigência
interface ServicoExigencia {
  id: string;
  servico_id: string;
  tipo: 'documento' | 'campo_texto' | 'campo_numero' | 'campo_data' | 'campo_select';
  nome: string;
  descricao?: string;
  obrigatorio: boolean;
  ordem: number;
  opcoes?: string[];
  validacao?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Solicitação
interface SolicitacaoServico {
  id: string;
  user_id: string;
  servico_id: string;
  numero_protocolo: string;
  status: 'pago' | 'em_analise' | 'aprovada' | 'rejeitada' | 'entregue';
  valor_total: number;
  payment_reference?: string;
  dados_enviados: Record<string, any>;
  observacoes_usuario?: string;
  observacoes_admin?: string;
  arquivo_entrega?: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  created_at: string;
  updated_at: string;
  servico?: Servico;
  profile?: {
    nome_completo: string;
    cpf: string;
    email: string;
  };
}

// Checkout
interface CheckoutData {
  servico: Servico;
  dados_formulario: Record<string, any>;
  customer_data: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    city: string;
    province: string;
  };
  payment_method: 'pix' | 'credit_card';
  card_data?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
    installmentCount: number;
  };
}
```

---

## Components and Interfaces

### Admin Components

#### 1. ServicosAdmin.tsx
**Responsabilidade:** Gestão completa de serviços (CRUD)

**Props:** Nenhuma (página completa)

**Estado:**
- Lista de serviços
- Filtros (categoria, status)
- Modal de criação/edição
- Serviço selecionado

**Funcionalidades:**
- Listar todos os serviços
- Filtrar por categoria e status
- Criar novo serviço
- Editar serviço existente
- Ativar/desativar serviço
- Configurar exigências

#### 2. SolicitacoesAdmin.tsx
**Responsabilidade:** Gestão de solicitações dos usuários

**Props:** Nenhuma (página completa)

**Estado:**
- Lista de solicitações
- Filtros (status, categoria, período)
- Solicitação selecionada
- Modal de detalhes

**Funcionalidades:**
- Listar todas as solicitações
- Filtrar e buscar
- Visualizar detalhes completos
- Atualizar status
- Adicionar observações
- Fazer upload de arquivo de entrega

### User Components

#### 3. SolicitacaoServicos.tsx
**Responsabilidade:** Menu unificado de solicitação

**Props:** Nenhuma (página completa)

**Estado:**
- Categoria selecionada
- Serviços disponíveis
- Histórico de solicitações

**Funcionalidades:**
- Exibir categorias
- Listar serviços por categoria
- Abrir formulário de solicitação
- Visualizar histórico

#### 4. CheckoutServico.tsx
**Responsabilidade:** Checkout transparente

**Props:**
```typescript
interface CheckoutServicoProps {
  servico: Servico;
  dados_formulario: Record<string, any>;
  onSuccess: (solicitacao: SolicitacaoServico) => void;
  onCancel: () => void;
}
```

**Estado:**
- Dados do cliente
- Método de pagamento
- Dados do cartão (se aplicável)
- Loading states

**Funcionalidades:**
- Coletar dados do cliente
- Selecionar método de pagamento
- Processar PIX (gerar QR Code)
- Processar Cartão (campos transparentes)
- Exibir resultado

### Shared Components

#### 5. ServicoCard.tsx
**Props:**
```typescript
interface ServicoCardProps {
  servico: Servico;
  onSolicitar: (servico: Servico) => void;
  variant?: 'default' | 'compact';
}
```

#### 6. ServicoForm.tsx
**Props:**
```typescript
interface ServicoFormProps {
  servico: Servico;
  exigencias: ServicoExigencia[];
  onSubmit: (dados: Record<string, any>) => void;
  onCancel: () => void;
}
```

**Funcionalidades:**
- Renderizar campos dinamicamente baseado em exigências
- Validar campos obrigatórios
- Upload de documentos
- Salvar rascunho (opcional)

#### 7. CardPaymentForm.tsx
**Props:**
```typescript
interface CardPaymentFormProps {
  onCardDataChange: (cardData: CardData) => void;
  maxParcelas: number;
  valorTotal: number;
}
```

**Funcionalidades:**
- Campos de cartão com validação
- Formatação automática (número, validade)
- Validação Luhn
- Seletor de parcelas

#### 8. PixPaymentDisplay.tsx
**Props:**
```typescript
interface PixPaymentDisplayProps {
  qrCode: string;
  qrCodeCopyPaste: string;
  valor: number;
  onPaymentConfirmed: () => void;
}
```

**Funcionalidades:**
- Exibir QR Code
- Botão copiar código
- Instruções de pagamento
- Polling para confirmação

---

## Custom Hooks

### useServicos.ts

```typescript
export const useServicos = () => {
  // Buscar todos os serviços
  const { data: servicos, isLoading, refetch } = useSupabaseQuery(
    ['servicos'],
    async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*, servico_exigencias(*)')
        .order('categoria, sort_order');
      
      if (error) throw error;
      return data;
    }
  );

  // Buscar serviços por categoria
  const buscarPorCategoria = (categoria: string) => {
    return servicos?.filter(s => s.categoria === categoria && s.is_active);
  };

  // Criar serviço
  const criarServico = useSupabaseMutation(
    async (servico: Partial<Servico>) => {
      const { data, error } = await supabase
        .from('servicos')
        .insert(servico)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Serviço criado com sucesso!',
      onSuccess: () => refetch()
    }
  );

  // Atualizar serviço
  const atualizarServico = useSupabaseMutation(
    async ({ id, ...updates }: Partial<Servico> & { id: string }) => {
      const { data, error } = await supabase
        .from('servicos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      successMessage: 'Serviço atualizado!',
      onSuccess: () => refetch()
    }
  );

  // Desativar serviço (soft delete)
  const desativarServico = useSupabaseMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('servicos')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    {
      successMessage: 'Serviço desativado!',
      onSuccess: () => refetch()
    }
  );

  return {
    servicos,
    isLoading,
    buscarPorCategoria,
    criarServico,
    atualizarServico,
    desativarServico,
    refetch
  };
};
```

### useSolicitacoes.ts

```typescript
export const useSolicitacoes = () => {
  const { user } = useAuth();

  // Buscar solicitações do usuário
  const { data: minhasSolicitacoes, isLoading } = useSupabaseQuery(
    ['solicitacoes', user?.id],
    async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .select('*, servico:servicos(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    { enabled: !!user }
  );

  // Buscar todas (admin)
  const { data: todasSolicitacoes } = useSupabaseQuery(
    ['solicitacoes-admin'],
    async () => {
      const { data, error } = await supabase
        .from('solicitacoes_servicos')
        .select('*, servico:servicos(*), profile:profiles(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );

  // Atualizar status (admin)
  const atualizarStatus = useSupabaseMutation(
    async ({ id, status, observacoes }: { 
      id: string; 
      status: string; 
      observacoes?: string;
    }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      
      if (observacoes) updates.observacoes_admin = observacoes;
      if (status === 'aprovada') updates.data_aprovacao = new Date().toISOString();
      if (status === 'entregue') updates.data_entrega = new Date().toISOString();

      const { error } = await supabase
        .from('solicitacoes_servicos')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    {
      successMessage: 'Status atualizado!',
      onSuccess: () => refetch()
    }
  );

  return {
    minhasSolicitacoes,
    todasSolicitacoes,
    isLoading,
    atualizarStatus
  };
};
```

### useCheckoutTransparente.ts

```typescript
export const useCheckoutTransparente = () => {
  const { user } = useAuth();
  const { createCustomer } = useAsaasCustomers();
  const { createPixPayment } = useAsaasPixPayments();
  const { processCardPayment } = useAsaasCardPayments();
  const [isProcessing, setIsProcessing] = useState(false);

  const processarCheckout = async (checkoutData: CheckoutData) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setIsProcessing(true);
    
    try {
      // 1. Criar/verificar cliente
      const customer = await createCustomer.mutateAsync(checkoutData.customer_data);
      
      // 2. Calcular valor (com desconto PIX se aplicável)
      const isPix = checkoutData.payment_method === 'pix';
      const desconto = isPix ? checkoutData.servico.valor * 0.05 : 0;
      const valorFinal = checkoutData.servico.valor - desconto;
      
      // 3. Preparar dados base
      const basePaymentData = {
        customer: customer.id,
        value: valorFinal,
        description: `${checkoutData.servico.nome} - COMADEMIG`,
        externalReference: `servico_${user.id}_${Date.now()}`,
        serviceType: 'servico',
        serviceData: {
          servico_id: checkoutData.servico.id,
          dados_formulario: checkoutData.dados_formulario
        }
      };

      let paymentResult;

      // 4. Processar pagamento
      if (isPix) {
        paymentResult = await createPixPayment.mutateAsync({
          ...basePaymentData,
          billingType: 'PIX',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      } else {
        if (!checkoutData.card_data) {
          throw new Error('Dados do cartão são obrigatórios');
        }
        
        paymentResult = await processCardPayment.mutateAsync({
          ...basePaymentData,
          billingType: 'CREDIT_CARD',
          dueDate: new Date().toISOString().split('T')[0],
          creditCard: checkoutData.card_data,
          creditCardHolderInfo: checkoutData.customer_data,
          installmentCount: checkoutData.card_data.installmentCount
        });
      }

      // 5. Salvar cobrança localmente
      await supabase.from('asaas_cobrancas').insert({
        asaas_id: paymentResult.id,
        user_id: user.id,
        customer_id: customer.id,
        service_type: 'servico',
        service_data: basePaymentData.serviceData,
        billing_type: checkoutData.payment_method.toUpperCase(),
        status: paymentResult.status,
        value: valorFinal,
        original_value: checkoutData.servico.valor,
        due_date: paymentResult.dueDate,
        description: paymentResult.description,
        external_reference: paymentResult.externalReference
      });

      return {
        ...paymentResult,
        valorFinal,
        desconto,
        customer
      };
      
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processarCheckout,
    isProcessing
  };
};
```

---

## Error Handling

### Estratégia de Tratamento de Erros

1. **Validação Frontend**
   - Validar campos antes de enviar
   - Mostrar erros inline
   - Prevenir submissão com dados inválidos

2. **Erros de API**
   - Capturar erros do Supabase
   - Capturar erros do Asaas
   - Mostrar mensagens amigáveis
   - Logar erros para análise

3. **Erros de Pagamento**
   - Cartão recusado → mensagem clara
   - Timeout → permitir retry
   - Webhook falha → retry automático

4. **Feedback ao Usuário**
   - Toast notifications (sonner)
   - Mensagens de erro específicas
   - Loading states claros
   - Confirmações de sucesso

### Exemplo de Tratamento

```typescript
try {
  const result = await processarCheckout(checkoutData);
  toast.success('Pagamento processado com sucesso!');
  navigate(`/dashboard/solicitacao/${result.id}`);
} catch (error: any) {
  // Erro específico do Asaas
  if (error.code === 'invalid_card') {
    toast.error('Cartão inválido. Verifique os dados e tente novamente.');
  } 
  // Erro de validação
  else if (error.code === 'validation_error') {
    toast.error('Dados inválidos: ' + error.message);
  }
  // Erro genérico
  else {
    toast.error('Erro ao processar pagamento. Tente novamente.');
    console.error('Checkout error:', error);
  }
}
```

---

## Testing Strategy

### Unit Tests

**Componentes a testar:**
- ServicoCard - renderização e interações
- ServicoForm - validação dinâmica
- CardPaymentForm - validação de cartão
- PixPaymentDisplay - exibição de QR Code

**Hooks a testar:**
- useServicos - CRUD operations
- useSolicitacoes - queries e mutations
- useCheckoutTransparente - fluxo de pagamento

### Integration Tests

**Fluxos a testar:**
1. Admin cria serviço → aparece para usuário
2. Usuário solicita serviço → paga → webhook cria registro
3. Admin atualiza status → usuário recebe notificação

### E2E Tests (Cypress)

**Cenários críticos:**
1. Fluxo completo de solicitação com PIX
2. Fluxo completo de solicitação com Cartão
3. Admin gerencia solicitação do início ao fim

---

## Security Considerations

### RLS Policies

```sql
-- Serviços: todos podem ler ativos, apenas admin pode modificar
CREATE POLICY "Serviços ativos são públicos"
  ON servicos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Apenas admin pode gerenciar serviços"
  ON servicos FOR ALL
  USING (auth.jwt() ->> 'tipo_membro' = 'super_admin');

-- Solicitações: usuário vê apenas suas, admin vê todas
CREATE POLICY "Usuário vê apenas suas solicitações"
  ON solicitacoes_servicos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todas as solicitações"
  ON solicitacoes_servicos FOR SELECT
  USING (auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin'));

-- Apenas webhook pode inserir (via service role)
CREATE POLICY "Apenas service role pode inserir"
  ON solicitacoes_servicos FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Apenas admin pode atualizar status
CREATE POLICY "Apenas admin pode atualizar"
  ON solicitacoes_servicos FOR UPDATE
  USING (auth.jwt() ->> 'tipo_membro' IN ('super_admin', 'admin'));
```

### Validações

1. **Dados do Cartão**
   - Validar número (Luhn algorithm)
   - Validar CVV (3-4 dígitos)
   - Validar validade (não expirado)

2. **Dados do Cliente**
   - Validar CPF/CNPJ
   - Validar email
   - Validar telefone (formato)

3. **Upload de Arquivos**
   - Validar tipo (PDF, JPG, PNG)
   - Validar tamanho (max 5MB)
   - Scan de vírus (opcional)

---

## Performance Optimization

### Caching Strategy

1. **React Query Cache**
   - Serviços: cache de 5 minutos
   - Solicitações: cache de 1 minuto
   - Invalidar após mutations

2. **Prefetching**
   - Prefetch serviços ao entrar no dashboard
   - Prefetch exigências ao selecionar serviço

3. **Lazy Loading**
   - Componentes de checkout
   - Imagens de QR Code
   - Histórico de solicitações

### Database Optimization

1. **Índices**
   - Todos os índices já definidos no schema
   - Monitorar query performance

2. **Queries Otimizadas**
   - Usar select específico (não `*`)
   - Limitar resultados com pagination
   - Usar joins eficientes

---

## Migration Strategy

### Fase 1: Preparação
1. Criar novas tabelas
2. Configurar RLS policies
3. Testar em ambiente de dev

### Fase 2: Migração de Dados
1. Migrar valores_certidoes → servicos
2. Migrar servicos_regularizacao → servicos
3. Migrar solicitacoes antigas → solicitacoes_servicos
4. Validar integridade

### Fase 3: Deploy
1. Deploy do novo módulo
2. Testar em produção
3. Monitorar erros

### Fase 4: Limpeza
1. Deprecar tabelas antigas
2. Remover menus antigos
3. Atualizar documentação

---

## Monitoring and Logging

### Métricas a Monitorar

1. **Pagamentos**
   - Taxa de sucesso PIX vs Cartão
   - Tempo médio de processamento
   - Erros de pagamento

2. **Solicitações**
   - Tempo médio de aprovação
   - Taxa de rejeição
   - Serviços mais solicitados

3. **Performance**
   - Tempo de carregamento de páginas
   - Tempo de resposta de APIs
   - Erros de frontend

### Logs Essenciais

1. **Audit Logs**
   - Todas as operações admin
   - Mudanças de status
   - Criação/edição de serviços

2. **Payment Logs**
   - Tentativas de pagamento
   - Webhooks recebidos
   - Erros de processamento

3. **Error Logs**
   - Stack traces completos
   - Contexto da requisição
   - User ID e timestamp

---

## Next Steps

1. ✅ Requirements aprovados
2. ✅ Design document criado
3. ⏳ Criar tasks.md (implementation plan)
4. ⏳ Executar Fase 1: Análise do banco
5. ⏳ Implementar componentes
6. ⏳ Testar e validar
7. ⏳ Deploy e migração
