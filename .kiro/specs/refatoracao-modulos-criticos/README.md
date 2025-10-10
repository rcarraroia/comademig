# Refatoração de Módulos Críticos - COMADEMIG

## Visão Geral

Esta especificação define a refatoração e correção de três módulos críticos do sistema COMADEMIG:

1. **Módulo de Suporte (Tickets)** - Correção de inconsistências
2. **Módulo de Afiliados** - Implementação completa
3. **Módulo de Split de Pagamentos** - Correção da divisão tripla e interface de gestão

## Status Atual

- ✅ Requirements: Completo
- ✅ Design: Completo
- ✅ Tasks: Completo
- ⏳ Implementation: Pendente

## Documentos

- **[requirements.md](./requirements.md)** - Requisitos detalhados com user stories e acceptance criteria
- **[design.md](./design.md)** - Design técnico completo com arquitetura, componentes e estratégias
- **[tasks.md](./tasks.md)** - Plano de implementação com 44 tarefas específicas

## Resumo dos Módulos

### 1. Módulo de Suporte

**Problema**: Hook `useSuporteTickets.ts` usa nomenclatura incorreta de tabelas (`suporte`, `suporte_mensagens`) que não existem no banco.

**Solução**: 
- Remover hook incorreto
- Usar apenas `useSupport.ts` (correto)
- Criar políticas RLS
- Testar fluxo completo

**Impacto**: Correção crítica para funcionamento do sistema de tickets.

### 2. Módulo de Afiliados

**Problema**: Implementação parcial, falta painel do usuário e painel admin completos.

**Solução**:
- Criar tabela `affiliate_referrals`
- Implementar dashboard com estatísticas reais
- Criar lista de indicações e comissões
- Implementar ferramentas de divulgação (link, QR code)
- Criar painel admin completo (gestão, relatórios, configurações)

**Impacto**: Programa de afiliados totalmente funcional.

### 3. Módulo de Split de Pagamentos

**Problema**: Divisão INCORRETA - divide 100% para 1 destinatário ao invés de 3.

**Solução**:
- Corrigir Edge Functions para divisão tripla:
  - **Filiação**: 40% COMADEMIG + 40% RENUM + 20% Afiliado
  - **Serviços**: 60% COMADEMIG + 40% RENUM
  - **Publicidade**: 100% COMADEMIG
- Criar interface super admin para gestão
- Implementar histórico e relatórios

**Impacto**: CRÍTICO - Sistema financeiro correto e auditável.

## Ordem de Implementação

### Fase 1: Correções Críticas (1-2 dias)
1. Módulo de Suporte (3 tarefas)
2. Estrutura de Banco (6 tarefas)

### Fase 2: Afiliados - Backend (2-3 dias)
3. Hooks e Lógica (3 tarefas)

### Fase 3: Afiliados - Frontend (4-5 dias)
4. Painel do Usuário (5 tarefas)
5. Painel Admin (7 tarefas)

### Fase 4: Split - Correção (3-4 dias)
6. Divisão Tripla (5 tarefas)
7. Interface Super Admin (6 tarefas)

### Fase 5: Integração (2-3 dias)
8. Fluxo Completo (6 tarefas)

**Tempo Total Estimado**: 12-17 dias de desenvolvimento

## Como Executar

### Iniciar Implementação

1. Abra o arquivo `tasks.md`
2. Clique em "Start task" na primeira tarefa
3. Siga as instruções de cada tarefa
4. Marque como completo ao finalizar

### Ordem Recomendada

Execute as tarefas na ordem apresentada, pois há dependências entre elas:
- Estrutura de banco deve ser criada antes de implementar hooks
- Hooks devem existir antes de criar componentes
- Componentes devem estar prontos antes da integração

### Testes

Tarefas marcadas com `*` são opcionais (testes). Execute-as se desejar validação adicional.

## Requisitos Técnicos

### Tecnologias
- React 18 + TypeScript
- Supabase (PostgreSQL + Edge Functions)
- React Query (TanStack Query)
- shadcn/ui + Radix UI
- Tailwind CSS

### Dependências Novas
- `qrcode` - Para geração de QR codes
- `recharts` - Para gráficos (já existe no projeto)

### Variáveis de Ambiente

Adicionar no painel do Supabase:
```
RENUM_WALLET_ID=<wallet_id_da_renum>
```

## Segurança

Todas as tabelas terão políticas RLS configuradas:
- Usuários veem apenas seus próprios dados
- Admins veem dados de todos os usuários
- Super admins têm acesso total incluindo configurações de split

## Contato

Para dúvidas sobre a especificação, consulte os documentos detalhados ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: 09/01/2025  
**Versão**: 1.0  
**Status**: Pronto para implementação
