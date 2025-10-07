# Requisitos - Refatoração Painel Administrativo COMADEMIG

## Introdução

Esta especificação define os requisitos para a refatoração completa do painel administrativo do sistema COMADEMIG (Convenção de Ministros das Assembleias de Deus em Minas Gerais), incluindo correção de bugs críticos que impedem o funcionamento adequado do sistema de filiação e gestão de cargos eclesiásticos.

O sistema atual apresenta falhas críticas no relacionamento entre cargos (member_types) e planos de assinatura (subscription_plans), impossibilitando que pastores, bispos, diáconos e outros membros completem o processo de filiação. Além disso, o painel administrativo necessita de reorganização para melhor separação entre funcionalidades administrativas e de usuário.

## Requisitos

### Requisito 1 - Correção do Sistema Unificado de Cargos e Planos

**User Story:** Como administrador do sistema, eu quero criar cargos eclesiásticos com múltiplos planos de assinatura, para que os membros possam escolher entre diferentes periodicidades de pagamento (mensal, semestral, anual).

#### Acceptance Criteria

1. QUANDO o administrador criar um novo cargo eclesiástico ENTÃO o sistema SHALL permitir adicionar múltiplos planos de assinatura para o mesmo cargo
2. QUANDO o administrador criar um plano "Bispo - Mensal R$ 10,00" ENTÃO o sistema SHALL criar registro em member_types E SHALL criar registro vinculado em subscription_plans
3. QUANDO o sistema criar planos de assinatura ENTÃO SHALL estabelecer relacionamento 1:N entre member_types e subscription_plans via member_type_id
4. QUANDO um membro acessar o formulário de filiação ENTÃO o sistema SHALL exibir todos os planos disponíveis para o cargo selecionado
5. QUANDO o membro selecionar um cargo ENTÃO o sistema SHALL mostrar dropdown com todas as periodicidades disponíveis (mensal, semestral, anual)

### Requisito 2 - Implementação de Hooks e Mutations Funcionais

**User Story:** Como administrador, eu quero editar e gerenciar cargos e planos existentes, para que possa manter o sistema atualizado conforme necessidades da convenção.

#### Acceptance Criteria

1. QUANDO o administrador clicar no botão "Editar" de um cargo ENTÃO o sistema SHALL abrir modal de edição com dados preenchidos
2. QUANDO o administrador clicar no botão "Deletar" ENTÃO o sistema SHALL solicitar confirmação E SHALL executar soft delete (is_active = false)
3. QUANDO o administrador alterar status de um cargo ENTÃO o sistema SHALL atualizar is_active via useToggleMemberTypeStatus hook
4. QUANDO operações de CRUD forem executadas ENTÃO o sistema SHALL usar TanStack Query para cache e sincronização
5. QUANDO houver erro em operação ENTÃO o sistema SHALL exibir toast de erro com mensagem clara

### Requisito 3 - Correção de Propriedades e Estrutura de Dados

**User Story:** Como desenvolvedor, eu quero que todas as propriedades do sistema estejam corretas e funcionais, para que não haja erros de renderização ou dados inconsistentes.

#### Acceptance Criteria

1. QUANDO o sistema exibir ordem de exibição ENTÃO SHALL usar propriedade sort_order ao invés de order_of_exhibition
2. QUANDO o sistema consultar dados ENTÃO SHALL garantir que todas as foreign keys estejam válidas
3. QUANDO houver registros órfãos ENTÃO o sistema SHALL corrigir ou remover automaticamente
4. QUANDO o banco for consultado ENTÃO SHALL retornar apenas dados consistentes e válidos

### Requisito 4 - Reorganização do Menu Lateral Administrativo

**User Story:** Como administrador, eu quero um menu lateral bem organizado com separação clara entre funcionalidades administrativas e de usuário, para que possa navegar eficientemente pelo sistema.

#### Acceptance Criteria

1. QUANDO o administrador acessar o painel ENTÃO o sistema SHALL exibir seção "Administração" separada da seção "Usuário"
2. QUANDO houver funcionalidades duplicadas ENTÃO o sistema SHALL manter apenas uma versão na seção apropriada
3. QUANDO o menu for renderizado ENTÃO SHALL agrupar funcionalidades por categoria (Usuários, Financeiro, Conteúdo, Sistema)
4. QUANDO o administrador navegar ENTÃO SHALL destacar visualmente a seção ativa
5. QUANDO houver rotas não implementadas ENTÃO SHALL remover do menu ou implementar funcionalidade

### Requisito 5 - Sistema de Suporte Completo

**User Story:** Como membro da convenção, eu quero abrir tickets de suporte e acompanhar o atendimento, para que possa resolver dúvidas sobre filiação, pagamentos e outros serviços.

#### Acceptance Criteria

1. QUANDO o membro acessar suporte ENTÃO o sistema SHALL exibir categorias predefinidas (Filiação, Financeiro, Certidões, Técnico, etc.)
2. QUANDO o membro criar ticket ENTÃO o sistema SHALL gerar ID único E SHALL notificar administradores
3. QUANDO houver resposta do suporte ENTÃO o sistema SHALL notificar o membro via email/sistema
4. QUANDO o administrador acessar tickets ENTÃO SHALL ver lista completa com filtros por status, categoria e prioridade
5. QUANDO ticket for resolvido ENTÃO o sistema SHALL permitir avaliação do atendimento

### Requisito 6 - Sistema de Auditoria e Logs

**User Story:** Como administrador, eu quero visualizar logs de atividades do sistema, para que possa auditar alterações e identificar problemas de segurança.

#### Acceptance Criteria

1. QUANDO usuário executar ação crítica ENTÃO o sistema SHALL registrar em user_activity_log com timestamp, IP e user_agent
2. QUANDO houver alteração em dados sensíveis ENTÃO SHALL capturar valores antigos e novos em JSONB
3. QUANDO administrador acessar auditoria ENTÃO SHALL ver relatório filtrado por usuário, tabela e período
4. QUANDO houver tentativa de acesso não autorizado ENTÃO SHALL registrar e alertar administradores
5. QUANDO logs atingirem limite ENTÃO o sistema SHALL arquivar automaticamente registros antigos

### Requisito 7 - Dashboard Financeiro Administrativo

**User Story:** Como administrador financeiro, eu quero visualizar relatórios completos de transações e receitas, para que possa acompanhar a saúde financeira da convenção.

#### Acceptance Criteria

1. QUANDO administrador acessar dashboard financeiro ENTÃO SHALL exibir métricas de receita mensal, anual e por cargo
2. QUANDO houver transações pendentes ENTÃO SHALL destacar em seção específica com ações disponíveis
3. QUANDO integração com Asaas estiver ativa ENTÃO SHALL sincronizar status de pagamentos automaticamente
4. QUANDO gerar relatórios ENTÃO SHALL permitir exportação em PDF e Excel
5. QUANDO houver inadimplência ENTÃO SHALL exibir alertas e sugestões de ação

### Requisito 8 - Histórico de Transações Financeiras

**User Story:** Como membro, eu quero visualizar meu histórico completo de pagamentos, para que possa acompanhar minha situação financeira na convenção.

#### Acceptance Criteria

1. QUANDO membro acessar financeiro ENTÃO o sistema SHALL exibir todas as transações ordenadas por data
2. QUANDO transação estiver pendente ENTÃO SHALL exibir link para pagamento via Asaas
3. QUANDO pagamento for confirmado ENTÃO SHALL atualizar status automaticamente via webhook
4. QUANDO houver reembolso ENTÃO SHALL registrar e notificar o membro
5. QUANDO membro solicitar comprovante ENTÃO o sistema SHALL gerar PDF com dados da transação

### Requisito 9 - Migração e Correção do Banco de Dados

**User Story:** Como administrador de sistema, eu quero que o banco de dados esteja estruturado corretamente, para que todas as funcionalidades operem sem erros.

#### Acceptance Criteria

1. QUANDO migração for executada ENTÃO o sistema SHALL corrigir relacionamento member_types (1:N) subscription_plans
2. QUANDO tabelas faltantes forem criadas ENTÃO SHALL incluir support_tickets, support_messages, financial_transactions, user_activity_log
3. QUANDO registros órfãos forem identificados ENTÃO SHALL corrigir foreign keys ou remover dados inconsistentes
4. QUANDO políticas RLS forem aplicadas ENTÃO SHALL garantir segurança adequada por role de usuário
5. QUANDO triggers forem criados ENTÃO SHALL automatizar updated_at e auditoria de alterações

### Requisito 10 - Separação de Funcionalidades Admin/Usuário

**User Story:** Como usuário do sistema, eu quero ver apenas as funcionalidades relevantes ao meu perfil, para que tenha uma experiência limpa e focada.

#### Acceptance Criteria

1. QUANDO usuário comum acessar dashboard ENTÃO SHALL ver apenas: Perfil, Carteira, Financeiro, Certidões, Afiliados, Suporte
2. QUANDO administrador acessar dashboard ENTÃO SHALL ver seção adicional com: Gestão de Usuários, Cargos/Planos, Financeiro Admin, Auditoria, Conteúdo
3. QUANDO houver mudança de role ENTÃO o sistema SHALL atualizar menu automaticamente sem necessidade de relogin
4. QUANDO funcionalidade for mista ENTÃO SHALL separar em componentes específicos por role
5. QUANDO rota administrativa for acessada por usuário comum ENTÃO SHALL redirecionar para página de acesso negado