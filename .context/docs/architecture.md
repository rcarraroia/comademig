# Arquitetura do Sistema COMADEMIG

## Visão Geral da Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Asaas         │
│   React + TS    │◄──►│   PostgreSQL    │    │   Gateway       │
│   Vite + Tailwind│    │   Auth + RLS    │◄──►│   Pagamentos    │
└─────────────────┘    │   Edge Functions│    └─────────────────┘
                       │   Storage       │
                       └─────────────────┘
```

## Componentes Principais

### 1. Frontend (React + TypeScript)
- **Localização**: `/src`
- **Responsabilidades**:
  - Interface do usuário
  - Validação de formulários
  - Gerenciamento de estado local
  - Comunicação com APIs

### 2. Backend (Supabase)
- **Localização**: `/supabase`
- **Componentes**:
  - **PostgreSQL**: Banco de dados principal
  - **Auth**: Sistema de autenticação
  - **RLS**: Políticas de segurança em nível de linha
  - **Edge Functions**: Lógica de negócio serverless
  - **Storage**: Armazenamento de arquivos

### 3. Gateway de Pagamentos (Asaas)
- **Integração**: Via Edge Functions
- **Funcionalidades**:
  - Processamento de pagamentos
  - Webhooks de notificação
  - Split de pagamentos para afiliados

## Estrutura de Pastas

### Frontend (`/src`)
```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base do shadcn/ui
│   ├── admin/          # Componentes específicos da área administrativa
│   ├── affiliates/     # Componentes do sistema de afiliados
│   ├── auth/           # Componentes de autenticação
│   ├── carteira/       # Componentes da carteira digital
│   ├── dashboard/      # Componentes do dashboard
│   └── payments/       # Componentes de pagamento
├── contexts/           # Contextos React (AuthContext)
├── hooks/              # Custom hooks
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos do Supabase
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
└── utils/              # Funções utilitárias
```

### Backend (`/supabase`)
```
supabase/
├── functions/          # Edge Functions (webhooks, pagamentos)
├── migrations/         # Migrações do banco de dados
└── config.toml         # Configuração do Supabase
```

## Fluxos de Dados Principais

### 1. Fluxo de Autenticação
```
Usuario → Frontend → Supabase Auth → RLS Policies → Database
```

### 2. Fluxo de Pagamento
```
Usuario → Frontend → Edge Function → Asaas API → Webhook → Database
```

### 3. Fluxo de Afiliados
```
Indicação → Pagamento → Split Automático → Comissão → Notificação
```

## Políticas de Segurança (RLS)

### Princípios
- **Isolamento por usuário**: Cada usuário só acessa seus próprios dados
- **Roles hierárquicos**: Admin > Super Admin > User
- **Validação dupla**: Frontend + Backend

### Implementação
- Políticas RLS em todas as tabelas sensíveis
- Validação de permissões em Edge Functions
- Tokens JWT com claims customizados

## Integrações Externas

### Asaas (Gateway de Pagamentos)
- **Ambiente**: Sandbox/Produção
- **Autenticação**: API Key
- **Webhooks**: Validação por token
- **Funcionalidades**:
  - Criação de clientes
  - Processamento de pagamentos
  - Split de pagamentos
  - Notificações de status

### Lovable (Hospedagem)
- **Deploy**: Automático via Git
- **Domínio**: Customizado
- **SSL**: Automático
- **CDN**: Global

## Padrões de Desenvolvimento

### Componentes React
- Functional components com hooks
- TypeScript para tipagem
- Props interface definidas
- Error boundaries para tratamento de erros

### Estado Global
- TanStack Query para cache de servidor
- Context API para estado de autenticação
- Local state para UI temporário

### Validação
- Zod schemas para validação de dados
- React Hook Form para formulários
- Validação dupla (frontend + backend)

## Monitoramento e Logs

### Frontend
- Error boundaries para captura de erros
- Console logs em desenvolvimento
- Métricas de performance

### Backend
- Logs de Edge Functions
- Métricas de banco de dados
- Monitoramento de webhooks

## Backup e Recuperação

### Banco de Dados
- Backups automáticos do Supabase
- Point-in-time recovery
- Replicação geográfica

### Código
- Versionamento Git
- Branches de desenvolvimento
- Deploy rollback automático