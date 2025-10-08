# Requirements Document - Correção do Painel Administrativo

## Introduction

O painel administrativo do COMADEMIG está parcialmente implementado. Existe uma infraestrutura de backend funcional (hooks, queries, banco de dados), mas o frontend está usando dados mockados em vez de consumir os dados reais disponíveis. Este projeto visa integrar completamente o frontend com o backend existente e implementar todas as funcionalidades CRUD necessárias para um sistema administrativo em produção.

**Contexto Atual:**
- ✅ Backend funcional com hooks e queries
- ✅ Banco de dados com estrutura completa
- ✅ Autenticação e permissões implementadas
- ❌ Frontend usando dados mockados
- ❌ Botões sem handlers funcionais
- ❌ Sistema de busca não implementado

**Objetivo:** Transformar o painel administrativo em um sistema totalmente funcional, pronto para produção, em 1-2 semanas.

---

## Requirements

### Requirement 1: Integração de Dados Reais

**User Story:** Como administrador, eu quero ver dados reais dos usuários cadastrados no sistema, para que eu possa gerenciar informações verdadeiras e não dados fictícios.

#### Acceptance Criteria

1. WHEN o administrador acessa a página de usuários THEN o sistema SHALL buscar dados reais do banco de dados via hook `useAdminData`
2. WHEN os dados estão sendo carregados THEN o sistema SHALL exibir um indicador de loading apropriado
3. WHEN ocorre um erro ao buscar dados THEN o sistema SHALL exibir uma mensagem de erro clara
4. WHEN não há usuários cadastrados THEN o sistema SHALL exibir uma mensagem informativa
5. WHEN os dados são carregados THEN as estatísticas (total, ativos, admins, novos) SHALL ser calculadas dinamicamente baseadas nos dados reais
6. WHEN os dados são exibidos THEN os campos SHALL ser mapeados corretamente (nome_completo, tipo_membro, cpf, telefone, igreja, cargo, status)

---

### Requirement 2: Sistema de Busca Funcional

**User Story:** Como administrador, eu quero buscar usuários por nome, CPF, telefone ou igreja, para que eu possa encontrar rapidamente registros específicos.

#### Acceptance Criteria

1. WHEN o administrador digita no campo de busca THEN o sistema SHALL filtrar a lista em tempo real
2. WHEN a busca retorna resultados THEN o sistema SHALL exibir o número de resultados encontrados
3. WHEN a busca não retorna resultados THEN o sistema SHALL exibir mensagem "Nenhum usuário encontrado" com opção de limpar busca
4. WHEN o administrador clica em "Limpar busca" THEN o sistema SHALL remover o filtro e exibir todos os usuários
5. WHEN o administrador clica em "Atualizar" THEN o sistema SHALL recarregar os dados do banco
6. IF a busca contém múltiplos termos THEN o sistema SHALL buscar em todos os campos (nome, CPF, telefone, igreja)

---

### Requirement 3: CRUD Completo de Usuários

**User Story:** Como administrador, eu quero criar, editar e excluir usuários, para que eu possa gerenciar completamente o cadastro de membros.

#### Acceptance Criteria

1. WHEN o administrador clica em "Novo Usuário" THEN o sistema SHALL abrir um modal de criação
2. WHEN o administrador preenche o formulário de criação THEN o sistema SHALL validar todos os campos obrigatórios
3. WHEN o administrador salva um novo usuário THEN o sistema SHALL inserir no banco e atualizar a lista automaticamente
4. WHEN o administrador clica em "Editar" THEN o sistema SHALL abrir um modal com os dados atuais do usuário
5. WHEN o administrador salva alterações THEN o sistema SHALL atualizar no banco e refletir na lista
6. WHEN o administrador clica em "Excluir" THEN o sistema SHALL solicitar confirmação
7. WHEN o administrador confirma exclusão THEN o sistema SHALL remover do banco e atualizar a lista
8. WHEN qualquer operação CRUD é concluída THEN o sistema SHALL exibir feedback visual (toast de sucesso/erro)

---

### Requirement 4: Sistema de Permissões

**User Story:** Como super administrador, eu quero gerenciar permissões e roles dos usuários, para que eu possa controlar o acesso ao sistema.

#### Acceptance Criteria

1. WHEN o super admin clica em "Permissões" THEN o sistema SHALL abrir um modal de gerenciamento de roles
2. WHEN o super admin altera o tipo_membro THEN o sistema SHALL validar a mudança
3. WHEN o super admin salva alterações de permissão THEN o sistema SHALL atualizar no banco e registrar no audit log
4. WHEN um admin tenta alterar permissões de outro admin THEN o sistema SHALL verificar se tem permissão
5. IF o usuário não tem permissão THEN o sistema SHALL exibir mensagem de erro e bloquear a ação

---

### Requirement 5: Exportação e Importação de Dados

**User Story:** Como administrador, eu quero exportar a lista de usuários para CSV/Excel e importar dados em lote, para que eu possa fazer backup e migração de dados.

#### Acceptance Criteria

1. WHEN o administrador clica em "Exportar" THEN o sistema SHALL gerar um arquivo CSV com todos os usuários
2. WHEN o administrador clica em "Importar" THEN o sistema SHALL abrir um modal de upload
3. WHEN o administrador faz upload de um CSV THEN o sistema SHALL validar o formato e os dados
4. WHEN os dados são válidos THEN o sistema SHALL exibir um preview antes de importar
5. WHEN o administrador confirma importação THEN o sistema SHALL inserir os dados no banco em lote
6. IF há erros na importação THEN o sistema SHALL exibir relatório detalhado dos erros

---

### Requirement 6: Filtros Avançados

**User Story:** Como administrador, eu quero filtrar usuários por tipo, status, data de cadastro e igreja, para que eu possa segmentar e analisar os dados.

#### Acceptance Criteria

1. WHEN o administrador clica em "Filtros Avançados" THEN o sistema SHALL abrir um painel de filtros
2. WHEN o administrador seleciona filtros THEN o sistema SHALL aplicar múltiplos filtros simultaneamente
3. WHEN filtros são aplicados THEN o sistema SHALL exibir o número de resultados
4. WHEN o administrador limpa filtros THEN o sistema SHALL remover todos os filtros e exibir lista completa
5. IF múltiplos filtros são selecionados THEN o sistema SHALL combinar com operador AND

---

### Requirement 7: Correção de Schema de Subscription Plans

**User Story:** Como desenvolvedor, eu quero corrigir o erro de schema na tabela subscription_plans, para que as queries funcionem corretamente.

#### Acceptance Criteria

1. WHEN o sistema consulta subscription_plans THEN o sistema SHALL usar os nomes de colunas corretos
2. WHEN há erro de coluna inexistente THEN o sistema SHALL identificar e corrigir o mapeamento
3. WHEN as queries são atualizadas THEN os tipos TypeScript SHALL ser atualizados correspondentemente
4. WHEN as correções são aplicadas THEN o sistema SHALL testar todas as queries relacionadas

---

### Requirement 8: Validação de Outras Páginas Admin

**User Story:** Como administrador, eu quero que todas as páginas do painel administrativo funcionem corretamente, para que eu possa gerenciar todos os aspectos do sistema.

#### Acceptance Criteria

1. WHEN o administrador acessa Financial Admin THEN o sistema SHALL exibir dados reais via useFinancialMetrics
2. WHEN o administrador acessa Audit Logs THEN o sistema SHALL exibir logs reais via useAudit
3. WHEN o administrador acessa Support Management THEN o sistema SHALL exibir tickets reais
4. WHEN o administrador acessa Certidões THEN o sistema SHALL exibir solicitações reais
5. WHEN o administrador acessa Notification Management THEN o sistema SHALL permitir criar e enviar notificações
6. IF alguma página usa dados mockados THEN o sistema SHALL ser atualizado para usar dados reais

---

### Requirement 9: Testes e Validação

**User Story:** Como desenvolvedor, eu quero garantir que todas as funcionalidades foram testadas, para que o sistema esteja pronto para produção.

#### Acceptance Criteria

1. WHEN todas as funcionalidades são implementadas THEN o sistema SHALL ser testado com dados reais
2. WHEN há mais de 100 usuários THEN o sistema SHALL manter boa performance
3. WHEN usuários sem permissão tentam acessar THEN o sistema SHALL bloquear corretamente
4. WHEN operações CRUD são executadas THEN o sistema SHALL registrar no audit log
5. WHEN há erros THEN o sistema SHALL exibir mensagens claras e não quebrar

---

### Requirement 10: Segurança e RLS Policies

**User Story:** Como administrador de sistema, eu quero garantir que as políticas de segurança estão corretas, para que apenas usuários autorizados acessem dados sensíveis.

#### Acceptance Criteria

1. WHEN um admin acessa dados THEN o sistema SHALL verificar RLS policies
2. WHEN um usuário comum tenta acessar painel admin THEN o sistema SHALL bloquear o acesso
3. WHEN dados sensíveis são exibidos THEN o sistema SHALL validar permissões
4. WHEN operações de escrita são executadas THEN o sistema SHALL validar autorização
5. IF políticas RLS estão incorretas THEN o sistema SHALL ser corrigido antes de produção
