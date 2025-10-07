# Plano de Implementação - Refatoração Painel Administrativo COMADEMIG

## Fase 1: Correção de Bugs Críticos e Estrutura do Banco

- [x] 1. Corrigir schema do banco de dados e relacionamentos




  - Executar migração para corrigir relacionamento member_types (1:N) subscription_plans
  - Adicionar colunas member_type_id e duration_months em subscription_plans
  - Criar constraint unique para evitar duplicação de periodicidade por cargo
  - Popular tabela com planos padrão (mensal, semestral, anual) para cada cargo existente
  - Corrigir registros órfãos em user_subscriptions


  - _Requisitos: 1.1, 1.2, 1.3, 9.1, 9.2, 9.3_




- [ ] 2. Criar tabelas faltantes do sistema
  - Criar tabelas support_categories, support_tickets, support_messages
  - Criar tabela user_activity_log para auditoria
  - Criar tabela financial_transactions para histórico financeiro
  - Configurar políticas RLS adequadas para cada tabela


  - Criar triggers para updated_at e auditoria automática
  - _Requisitos: 5.1, 6.1, 8.1, 9.4, 9.5_

- [ ] 3. Implementar hooks corrigidos para member types
  - Criar hook useMemberTypes com suporte a relacionamento 1:N
  - Implementar useCreateMemberTypeWithPlans para criação atômica


  - Criar useToggleMemberTypeStatus para ativar/desativar cargos
  - Implementar useDeleteMemberType com soft delete
  - Adicionar tratamento de erro e loading states
  - _Requisitos: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Corrigir componente MemberTypeManagement
  - Corrigir propriedade order_of_exhibition para sort_order
  - Implementar botões editar/deletar funcionais


  - Adicionar modal de confirmação para exclusão
  - Implementar formulário de edição de cargos e planos
  - Adicionar validação de dados com Zod
  - _Requisitos: 2.1, 2.5, 3.1, 3.2_




## Fase 2: Sistema de Suporte Completo

- [x] 5. Implementar estrutura base do sistema de suporte


  - Criar interfaces TypeScript para tickets, mensagens e categorias
  - Implementar hooks useSupport para CRUD de tickets
  - Criar hook useSupportMessages para chat em tempo real
  - Configurar subscriptions do Supabase para updates em tempo real
  - _Requisitos: 5.1, 5.2_

- [x] 6. Desenvolver componentes de suporte para usuários


  - Criar componente TicketForm com seleção de categoria
  - Implementar TicketList com filtros por status
  - Desenvolver TicketChat para mensagens do ticket
  - Adicionar upload de anexos para tickets
  - Implementar notificações de novas mensagens
  - _Requisitos: 5.1, 5.2, 5.3_

- [x] 7. Criar painel administrativo de suporte


  - Implementar SupportManagement com lista completa de tickets
  - Adicionar filtros por categoria, status, prioridade e usuário
  - Criar dashboard com métricas de atendimento
  - Implementar sistema de atribuição de tickets para staff
  - Adicionar funcionalidade de notas internas
  - _Requisitos: 5.4, 5.5_

## Fase 3: Sistema de Auditoria e Logs

- [x] 8. Implementar sistema de auditoria




  - Criar função genérica de trigger para auditoria
  - Aplicar triggers em tabelas críticas (profiles, member_types, subscription_plans)
  - Implementar hook useAudit para consulta de logs
  - Criar componente AuditLogTable com filtros avançados
  - _Requisitos: 6.1, 6.2, 6.3_

- [x] 9. Desenvolver dashboard de auditoria



  - Criar página AuditLogs com tabela paginada
  - Implementar filtros por usuário, tabela, ação e período
  - Adicionar UserActivityTimeline para visualização por usuário
  - Criar alertas para atividades suspeitas
  - Implementar exportação de logs em CSV/PDF
  - _Requisitos: 6.3, 6.4, 6.5_

## Fase 4: Dashboard Financeiro Administrativo

- [x] 10. Implementar estrutura financeira


  - Criar interfaces para métricas financeiras e transações
  - Implementar hook useFinancial para dados agregados
  - Criar hook useTransactions para histórico detalhado
  - Configurar integração com webhooks do Asaas
  - _Requisitos: 7.1, 7.3, 8.1_

- [x] 11. Desenvolver componentes do dashboard financeiro


  - Criar RevenueChart com gráficos de receita por período
  - Implementar PaymentStatusCards com métricas principais
  - Desenvolver MemberTypeRevenue com breakdown por cargo
  - Criar OverduePayments com lista de inadimplentes
  - _Requisitos: 7.1, 7.2, 7.5_

- [x] 12. Criar página FinancialAdmin completa


  - Integrar todos os componentes financeiros
  - Adicionar filtros por período, cargo e status
  - Implementar exportação de relatórios em PDF/Excel
  - Criar sistema de alertas para inadimplência
  - Adicionar ações em lote para cobrança
  - _Requisitos: 7.2, 7.4, 7.5_

## Fase 5: Histórico de Transações para Usuários

- [x] 13. Implementar histórico financeiro do usuário



  - Criar componente TransactionHistory para área do usuário
  - Implementar filtros por período e status de pagamento
  - Adicionar links diretos para pagamento via Asaas
  - Criar geração de comprovantes em PDF
  - _Requisitos: 8.1, 8.2, 8.5_

- [x] 14. Integrar webhooks do Asaas


  - Configurar endpoint para receber webhooks de pagamento
  - Implementar atualização automática de status de transações
  - Criar sistema de notificações para confirmação de pagamento
  - Adicionar tratamento de reembolsos e cancelamentos
  - _Requisitos: 8.2, 8.3, 8.4_

## Fase 6: Reorganização do Menu e Interface



- [x] 15. Refatorar menu lateral administrativo


  - Criar novo componente AdminSidebar com separação clara
  - Implementar lógica de exibição baseada em role do usuário
  - Reorganizar itens por categoria (Usuários, Financeiro, Sistema)
  - Remover duplicações e rotas não implementadas
  - Adicionar indicadores visuais para seção ativa
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2_

- [x] 16. Implementar separação de funcionalidades por role


  - Criar HOC ou hook para controle de acesso por role
  - Separar componentes mistos em versões admin/user específicas
  - Implementar redirecionamento para acesso negado
  - Atualizar rotas com proteção adequada
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

## Fase 7: Testes e Validação

- [ ]* 17. Implementar testes unitários
  - [ ]* 17.1 Escrever testes para hooks customizados (useMemberTypes, useSupport, useFinancial)
  - [ ]* 17.2 Criar testes para componentes de formulário com validação
  - [ ]* 17.3 Testar utilitários de formatação e validação de dados
  - _Requisitos: Todos os requisitos de funcionalidade_

- [ ]* 18. Executar testes de integração
  - [ ]* 18.1 Testar fluxo completo de criação de cargo + múltiplos planos
  - [ ]* 18.2 Validar sistema de suporte end-to-end (criação, resposta, resolução)
  - [ ]* 18.3 Testar sincronização com Asaas via webhooks
  - [ ]* 18.4 Validar políticas RLS e controle de acesso por role
  - _Requisitos: 1.1-1.5, 5.1-5.5, 8.2-8.4, 10.1-10.5_

## Fase 8: Otimização e Performance

- [ ] 19. Otimizar performance do sistema
  - Implementar paginação para listas grandes (tickets, transações, logs)
  - Adicionar lazy loading para componentes administrativos
  - Configurar cache inteligente com TanStack Query
  - Otimizar queries do banco com índices adequados
  - _Requisitos: Performance geral do sistema_

- [ ] 20. Implementar monitoramento e métricas
  - Adicionar logging de performance para queries lentas
  - Criar dashboard de métricas de uso do sistema
  - Implementar alertas para erros críticos
  - Configurar backup automático de dados críticos
  - _Requisitos: 6.1, 6.4 (auditoria e monitoramento)_